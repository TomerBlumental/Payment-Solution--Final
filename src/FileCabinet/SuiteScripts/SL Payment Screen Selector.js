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

                // Add Subsidiary Field
                var subsidiaryField = form.addField({
                    id: 'custpage_subsidiary',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Subsidiary'
                });
                subsidiaryField.isMandatory = true;

                // Add Currency Field
                var currencyField = form.addField({
                    id: 'custpage_currency',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Currency'
                });
                currencyField.isMandatory = true;
                currencyField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED // Initially disabled
                });

                // Add hidden field for subsidiary-currency mapping
                var mappingField = form.addField({
                    id: 'custpage_subsidiary_currency_map',
                    type: serverWidget.FieldType.TEXTAREA, // Hidden field
                    label: 'Subsidiary-Currency Mapping'
                });
                mappingField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                // Build the mapping of subsidiaries to currencies
                var subsidiaryCurrenciesMap = {};
                let accountSearch = query.runSuiteQL({
                    query: `
                        SELECT subsidiary,
                               currency
                        FROM   account
                        WHERE  custrecord_okoora_bank = 'T'
                    `,
                }).asMappedResults();

                accountSearch.forEach(function(result) {
                    var subsidiaryId = result.subsidiary;
                    var currencyId = result.currency;

                    if (!subsidiaryCurrenciesMap[subsidiaryId]) {
                        subsidiaryCurrenciesMap[subsidiaryId] = [];
                    }

                    if (!subsidiaryCurrenciesMap[subsidiaryId].includes(currencyId)) {
                        subsidiaryCurrenciesMap[subsidiaryId].push(currencyId);
                    }
                });

                // Populate Subsidiary Field
                subsidiaryField.addSelectOption({ value: '', text: '' });
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

                // Store the subsidiary-currency mapping as a JSON string in the hidden field
                mappingField.defaultValue = JSON.stringify(subsidiaryCurrenciesMap);

                // Attach the client script
                form.clientScriptModulePath = "SuiteScripts/CL Payment Selector.js";

                // Add Submit Button
                form.addSubmitButton({
                    label: 'Next'
                });

                context.response.writePage(form);
            } else {
                // Handle POST request
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