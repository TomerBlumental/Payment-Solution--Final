/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect'], 
    function(serverWidget, search, redirect) {

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var subsidiary = context.request.parameters.subsidiary;
                var currency = context.request.parameters.currency;

                var form = serverWidget.createForm({
                    title: 'Payment Screen'
                });

                // Attach Client Script using the module path
                form.clientScriptModulePath = './cs_summary_screen.js'; 

                var sublist = form.addSublist({
                    id: 'custpage_payment_sublist',
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: 'Payment Selection'
                });

                // Checkbox field
                sublist.addField({
                    id: 'custpage_select',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Select'
                });

                // Other fields...
                sublist.addField({
                    id: 'custpage_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Date'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'custpage_name',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Name'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'custpage_document_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Document Number'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'custpage_currency',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Currency'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'custpage_payment_amount',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Payment Amount'
                });

                sublist.addField({
                    id: 'custpage_amount',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Amount (Foreign Currency)'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'custpage_amount_remaining',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Amount Remaining (Foreign Currency)'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                // Load and populate sublist with data...
                var transactionSearchObj = search.load({
                    id: 'customsearch_payment_screen_result'
                });

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
                    var amount = parseFloat(results[i].getValue('fxamount'));
                    var amountRemaining = amount;

                    sublist.setSublistValue({
                        id: 'custpage_date',
                        line: i,
                        value: results[i].getValue('trandate')
                    });
                    sublist.setSublistValue({
                        id: 'custpage_name',
                        line: i,
                        value: results[i].getText('entity')
                    });
                    sublist.setSublistValue({
                        id: 'custpage_document_number',
                        line: i,
                        value: results[i].getValue('tranid')
                    });
                    sublist.setSublistValue({
                        id: 'custpage_currency',
                        line: i,
                        value: results[i].getText('currency')
                    });
                    sublist.setSublistValue({
                        id: 'custpage_amount',
                        line: i,
                        value: amount
                    });
                    sublist.setSublistValue({
                        id: 'custpage_amount_remaining',
                        line: i,
                        value: amountRemaining
                    });

                    sublist.setSublistValue({
                        id: 'custpage_payment_amount',
                        line: i,
                        value: 0
                    });
                }

                // Add the "Next" button
                form.addButton({
                    id: 'custpage_next',
                    label: 'Next',
                    functionName: 'goToSummary'
                });

                context.response.writePage(form);
            } else {
                // Handle the POST request if needed, but this may be handled by the summary Suitelet
            }
        }

        return {
            onRequest: onRequest
        };
    });