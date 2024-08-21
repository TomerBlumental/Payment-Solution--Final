/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/query', 'N/search', 'N/redirect'], 
    function(serverWidget, query, search, redirect) {

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

                // Running SuiteQL query to get subsidiary and currency IDs
                let accountSearch = query.runSuiteQL({
                    query: `
                        SELECT subsidiary,
                               currency
                        FROM   account
                        WHERE  custrecord_okoora_bank = 'T' 
                    `,
                }).asMappedResults();

                // Building the mapping of subsidiaries to unique currencies
                var subsidiaryCurrenciesMap = {};

                accountSearch.forEach(function(result) {
                    var subsidiaryId = result.subsidiary;
                    var currencyId = result.currency;

                    if (!subsidiaryCurrenciesMap[subsidiaryId]) {
                        subsidiaryCurrenciesMap[subsidiaryId] = [];
                    }

                    if (subsidiaryCurrenciesMap[subsidiaryId].indexOf(currencyId) === -1) {
                        subsidiaryCurrenciesMap[subsidiaryId].push(currencyId);
                    }
                });

                // Populate the Subsidiary Field with actual names
                for (var subsidiaryId in subsidiaryCurrenciesMap) {
                    var subsidiaryName = search.lookupFields({
                        type: 'subsidiary',
                        id: subsidiaryId,
                        columns: ['name']
                    }).name;

                    if (subsidiaryName) {
                        subsidiaryField.addSelectOption({
                            value: subsidiaryId,
                            text: subsidiaryName
                        });
                    }
                }

                // Populate the Currency Field with actual names
                currencyField.addSelectOption({ value: '', text: '' });
                var uniqueCurrencyIds = [];

                for (var subsidiaryId in subsidiaryCurrenciesMap) {
                    var currencyIds = subsidiaryCurrenciesMap[subsidiaryId];
                    currencyIds.forEach(function(currencyId) {
                        if (uniqueCurrencyIds.indexOf(currencyId) === -1) {
                            uniqueCurrencyIds.push(currencyId);
                        }
                    });
                }

                uniqueCurrencyIds.forEach(function(currencyId) {
                    var currencyName = search.lookupFields({
                        type: 'currency',
                        id: currencyId,
                        columns: ['name']
                    }).name;

                    if (currencyName) {
                        currencyField.addSelectOption({
                            value: currencyId,
                            text: currencyName
                        });
                    }
                });

                // Store the subsidiary-currency mapping as a JSON string in a hidden field
                var mappingField = form.addField({
                    id: 'custpage_subsidiary_currency_map',
                    type: serverWidget.FieldType.TEXTAREA, // Exposed as TEXTAREA for debugging
                    label: 'Subsidiary-Currency Mapping'
                });
                mappingField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN // Hide the field
                });
                mappingField.defaultValue = JSON.stringify(subsidiaryCurrenciesMap);

                // Attach the client script
                form.clientScriptModulePath = "SuiteScripts/CL Payment Selector.js";
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