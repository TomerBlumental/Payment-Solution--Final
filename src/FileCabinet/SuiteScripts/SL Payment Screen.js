/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/log'], 
    function(serverWidget, search, log) {

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var subsidiary = context.request.parameters.subsidiary;
                var currency = context.request.parameters.currency;

                var form = serverWidget.createForm({
                    title: 'Payment Screen'
                });

                var sublist = form.addSublist({
                    id: 'custpage_payment_sublist',
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: 'Payment Selection'
                });

                sublist.addField({
                    id: 'custpage_select',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Select'
                });

                sublist.addField({
                    id: 'custpage_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Date'
                });

                sublist.addField({
                    id: 'custpage_name',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Name'
                });

                sublist.addField({
                    id: 'custpage_document_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Document Number'
                });

                sublist.addField({
                    id: 'custpage_currency',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Currency'
                });

                sublist.addField({
                    id: 'custpage_amount',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Amount (Foreign Currency)'
                });

                sublist.addField({
                    id: 'custpage_amount_remaining',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Amount Remaining (Foreign Currency)'
                });

                sublist.addField({
                    id: 'custpage_payment_amount',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Payment Amount'
                });

                var transactionSearchObj = search.load({
                    id: 'customsearch_payment_screen_result'
                });

                // Add filters for subsidiary and currency based on the previous screen's input
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
                        value: results[i].getValue('fxamount')
                    });
                    sublist.setSublistValue({
                        id: 'custpage_amount_remaining',
                        line: i,
                        value: results[i].getValue('fxamountremaining')
                    });
                }

                form.addSubmitButton({
                    label: 'Submit'
                });

                context.response.writePage(form);
            } else {
                // Handle POST request for payment processing
                var request = context.request;
                var lineCount = request.getLineCount({ sublistId: 'custpage_payment_sublist' });
                for (var i = 0; i < lineCount; i++) {
                    var isSelected = request.getSublistValue({
                        sublistId: 'custpage_payment_sublist',
                        fieldId: 'custpage_select',
                        line: i
                    });

                    if (isSelected === 'T') {
                        var paymentAmount = request.getSublistValue({
                            sublistId: 'custpage_payment_sublist',
                            fieldId: 'custpage_payment_amount',
                            line: i
                        });

                        // Process the selected record and payment amount as needed
                        log.debug('Selected Record', 'Line: ' + i + ' Payment Amount: ' + paymentAmount);
                    }
                }
            }
        }

        return {
            onRequest: onRequest
        };
    });
