/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/format'], function(serverWidget, format) {

    function formatDateToNetSuite(dateString) {
        var date = new Date(dateString);
        var year = date.getFullYear();
        var month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
        var day = ('0' + date.getDate()).slice(-2);
        return day + '/' + month + '/' + year; // Format to DD/MM/YYYY
    }

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Summary of Selected Payments'
            });

            var summarySublist = form.addSublist({
                id: 'custpage_summary_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Selected Payments'
            });

            summarySublist.addField({
                id: 'custpage_summary_date',
                type: serverWidget.FieldType.DATE,
                label: 'Date'
            });

            summarySublist.addField({
                id: 'custpage_summary_name',
                type: serverWidget.FieldType.TEXT,
                label: 'Name'
            });

            summarySublist.addField({
                id: 'custpage_summary_document_number',
                type: serverWidget.FieldType.TEXT,
                label: 'Document Number'
            });

            summarySublist.addField({
                id: 'custpage_summary_currency',
                type: serverWidget.FieldType.TEXT,
                label: 'Currency'
            });

            summarySublist.addField({
                id: 'custpage_summary_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount (Foreign Currency)'
            });

            summarySublist.addField({
                id: 'custpage_summary_payment_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Payment Amount'
            });

            var selectedLines = JSON.parse(context.request.parameters.selectedLines || '[]');

            for (var i = 0; i < selectedLines.length; i++) {
                // Check if the date exists before formatting
                var formattedDate = selectedLines[i].date ? formatDateToNetSuite(selectedLines[i].date) : '';

                if (formattedDate) {
                    summarySublist.setSublistValue({
                        id: 'custpage_summary_date',
                        line: i,
                        value: formattedDate
                    });
                }

                // Set other fields with checks to ensure they have values
                if (selectedLines[i].name) {
                    summarySublist.setSublistValue({
                        id: 'custpage_summary_name',
                        line: i,
                        value: selectedLines[i].name
                    });
                }

                if (selectedLines[i].documentNumber) {
                    summarySublist.setSublistValue({
                        id: 'custpage_summary_document_number',
                        line: i,
                        value: selectedLines[i].documentNumber
                    });
                }

                if (selectedLines[i].currency) {
                    summarySublist.setSublistValue({
                        id: 'custpage_summary_currency',
                        line: i,
                        value: selectedLines[i].currency
                    });
                }

                if (selectedLines[i].amount) {
                    summarySublist.setSublistValue({
                        id: 'custpage_summary_amount',
                        line: i,
                        value: selectedLines[i].amount
                    });
                }

                if (selectedLines[i].paymentAmount) {
                    summarySublist.setSublistValue({
                        id: 'custpage_summary_payment_amount',
                        line: i,
                        value: selectedLines[i].paymentAmount
                    });
                }
            }

            form.addSubmitButton({
                label: 'Submit Final Batch'
            });

            context.response.writePage(form);
        }
    }

    return {
        onRequest: onRequest
    };
});