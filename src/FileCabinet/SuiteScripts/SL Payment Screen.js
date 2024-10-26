/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/log', 'N/url', 'N/redirect'], 
    function(serverWidget, search, log, url, redirect) {

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var subsidiary = context.request.parameters.subsidiary;
                var currency = context.request.parameters.currency;

                var form = serverWidget.createForm({
                    title: 'Payment Screen'
                });

                form.clientScriptModulePath = './cs_summary_screen.js'; 

                // Add the "Next" button to the form
                form.addButton({
                    id: 'custpage_next',
                    label: 'Next',
                    functionName: 'onNextClick'
                });

                var sublist = form.addSublist({
                    id: 'custpage_payment_sublist',
                    type: serverWidget.SublistType.LIST, // Prevent new line addition
                    label: 'Payment Selection'
                });

                sublist.addField({
                    id: 'custpage_selectfield',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Select'
                });

                sublist.addField({
                    id: 'custpage_datefield',
                    type: serverWidget.FieldType.DATE,
                    label: 'Date'
                });

                sublist.addField({
                    id: 'custpage_namefield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Name'
                });

                sublist.addField({
                    id: 'custpage_vendoridfield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Vendor ID'
                });

                sublist.addField({
                    id: 'custpage_documentnumberfield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Document Number'
                });

                sublist.addField({
                    id: 'custpage_currencyfield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Currency'
                });

                sublist.addField({
                    id: 'custpage_currencyidfield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Currency ID'
                });

                sublist.addField({
                    id: 'custpage_amountfield',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Total Amount (Foreign Currency)'
                });

                sublist.addField({
                    id: 'custpage_paymentamountfield',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Payment Amount'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY // Ensure it's editable
                });

                sublist.addField({
                    id: 'custpage_amountremainingfield',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Amount Remaining'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY // Ensure it's editable
                });

                // Load search and populate results
                var transactionSearchObj = search.load({
                    id: 'customsearch_payment_screen_result'
                });

                // Add filters for subsidiary and currency
                transactionSearchObj.filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: subsidiary
                }));

                transactionSearchObj.filters.push(search.createFilter({
                    name: 'currency',
                    operator: search.Operator.IS,
                    values: currency
                }));

                var results = transactionSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });

                for (var i = 0; i < results.length; i++) {
                    var amount = parseFloat(results[i].getValue('fxamount')) || 0;
                    var amountRemaining = amount;

                    sublist.setSublistValue({
                        id: 'custpage_datefield',
                        line: i,
                        value: results[i].getValue('trandate')
                    });

                    sublist.setSublistValue({
                        id: 'custpage_namefield',
                        line: i,
                        value: results[i].getText('entity')
                    });

                    sublist.setSublistValue({
                        id: 'custpage_vendoridfield',
                        line: i,
                        value: results[i].getValue('entity') // Vendor ID
                    });

                    sublist.setSublistValue({
                        id: 'custpage_documentnumberfield',
                        line: i,
                        value: results[i].getValue('tranid')
                    });

                    sublist.setSublistValue({
                        id: 'custpage_currencyfield',
                        line: i,
                        value: results[i].getText('currency')
                    });

                    sublist.setSublistValue({
                        id: 'custpage_currencyidfield',
                        line: i,
                        value: results[i].getValue('currency') // Currency ID
                    });

                    sublist.setSublistValue({
                        id: 'custpage_amountfield',
                        line: i,
                        value: amount
                    });

                    sublist.setSublistValue({
                        id: 'custpage_paymentamountfield',
                        line: i,
                        value: 0 // Initialize to 0 for user input later
                    });

                    sublist.setSublistValue({
                        id: 'custpage_amountremainingfield',
                        line: i,
                        value: amountRemaining
                    });
                }

                // Write the form to the response
                context.response.writePage(form);
            } else {
                // Handle POST request logic if needed
            }
        }

        return {
            onRequest: onRequest
        };
    });
