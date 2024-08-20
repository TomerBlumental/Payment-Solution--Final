/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect'], 
    function(serverWidget, search, redirect) {

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({
                    title: 'Subsidiary and Currency Selection'
                });

                var subsidiaryField = form.addField({
                    id: 'custpage_subsidiary',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Subsidiary'
                });

                var currencyField = form.addField({
                    id: 'custpage_currency',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Currency'
                });

                // Step 1: Search for Accounts where custrecord_okoora_bank = 'T'
                var accountSearch = search.create({
                    type: 'account',
                    filters: [
                        ['custrecord_okoora_bank', 'is', 'T']
                    ],
                    columns: ['subsidiary'] // Assuming subsidiary is related
                });

                var subsidiaryCurrenciesMap = {};

                accountSearch.run().each(function(result) {
                    var subsidiaryId = result.getValue('subsidiary');
                    
                    if (subsidiaryId && !subsidiaryCurrenciesMap[subsidiaryId]) {
                        subsidiaryCurrenciesMap[subsidiaryId] = [];
                    }
                    
                    // Get the currencies associated with this subsidiary
                    var subsidiarySearch = search.create({
                        type: search.Type.SUBSIDIARY,
                        filters: [
                            ['internalid', 'is', subsidiaryId]
                        ],
                        columns: ['currency']
                    });

                    subsidiarySearch.run().each(function(subResult) {
                        var currencyId = subResult.getValue('currency');
                        if (currencyId && subsidiaryCurrenciesMap[subsidiaryId].indexOf(currencyId) === -1) {
                            subsidiaryCurrenciesMap[subsidiaryId].push(currencyId);
                        }
                        return true;
                    });

                    return true;
                });

                // Step 2: Populate Subsidiary Field and relate it to the correct currencies
                for (var subsidiaryId in subsidiaryCurrenciesMap) {
                    var subsidiarySearch = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: subsidiaryId,
                        columns: ['name']
                    });
                    
                    var subsidiaryName = subsidiarySearch.name;
                    var cleanedName = subsidiaryName.split(' (')[0];  // Splits at the first ' (' and takes the first part
                    
                    subsidiaryField.addSelectOption({
                        value: subsidiaryId,
                        text: cleanedName
                    });
                }

                // Step 3: Populate Currency Field when a subsidiary is selected (for demonstration, we'll populate with all currencies initially)
                currencyField.isMandatory = true;

                // Populate currencies based on the first subsidiary as an example
                if (Object.keys(subsidiaryCurrenciesMap).length > 0) {
                    var firstSubsidiaryId = Object.keys(subsidiaryCurrenciesMap)[0];
                    subsidiaryField.defaultValue = firstSubsidiaryId;
                    
                    var currencyIds = subsidiaryCurrenciesMap[firstSubsidiaryId];
                    if (currencyIds && currencyIds.length > 0) {
                        var currencySearch = search.create({
                            type: search.Type.CURRENCY,
                            filters: [
                                ['internalid', 'anyof', currencyIds]
                            ],
                            columns: ['internalid', 'name']
                        });

                        currencySearch.run().each(function(result) {
                            currencyField.addSelectOption({
                                value: result.getValue({name: 'internalid'}),
                                text: result.getValue({name: 'name'})
                            });
                            return true;
                        });
                    }
                }

                form.addSubmitButton({
                    label: 'Next'
                });

                context.response.writePage(form);
            } else {
                var subsidiary = context.request.parameters.custpage_subsidiary;
                var currency = context.request.parameters.custpage_currency;

                if (!subsidiary || !currency) {
                    var form = serverWidget.createForm({
                        title: 'Subsidiary and Currency Selection'
                    });

                    form.addField({
                        id: 'custpage_subsidiary',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Subsidiary'
                    }).updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    }).setDefaultValue(subsidiary);

                    form.addField({
                        id: 'custpage_currency',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Currency'
                    }).updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    }).setDefaultValue(currency);

                    form.addPageInitMessage({
                        type: serverWidget.MessageType.ERROR,
                        title: 'Selection Error',
                        message: 'Please select both a Subsidiary and a Currency before proceeding.'
                    });

                    form.addSubmitButton({
                        label: 'Next'
                    });

                    context.response.writePage(form);
                } else {
                    redirect.toSuitelet({
                        scriptId: 'customscript_payment_screen', 
                        deploymentId: 'customdeploy_payment_screen', 
                        parameters: {
                            subsidiary: subsidiary,
                            currency: currency
                        }
                    });
                }
            }
        }

        return {
            onRequest: onRequest
        };
    });
