/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/format'], function(serverWidget, format) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Summary of Selected Payments'
            });

            var summarySublist = form.addSublist({
                id: 'custpage_summary_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Vendor Payment Summary'
            });

            summarySublist.addField({
                id: 'custpage_summary_vendor',
                type: serverWidget.FieldType.TEXT,
                label: 'Vendor'
            });

            summarySublist.addField({
                id: 'custpage_summary_currency',
                type: serverWidget.FieldType.TEXT,
                label: 'Currency'
            });

            summarySublist.addField({
                id: 'custpage_summary_doc_payed',
                type: serverWidget.FieldType.TEXT,
                label: 'Invoices Paid'
            });

            summarySublist.addField({
                id: 'custpage_summary_total_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Total Amount'
            });

            var vendorData = JSON.parse(context.request.parameters.vendorData || '{}');
            var totalSelectedAmount = 0;
            var line = 0;

            for (var vendor in vendorData) {
                summarySublist.setSublistValue({
                    id: 'custpage_summary_vendor',
                    line: line,
                    value: vendorData[vendor].vendor
                });
                summarySublist.setSublistValue({
                    id: 'custpage_summary_currency',
                    line: line,
                    value: vendorData[vendor].currency
                });
                summarySublist.setSublistValue({
                    id: 'custpage_summary_doc_payed',
                    line: line,
                    value: vendorData[vendor].doc_payed
                });
                summarySublist.setSublistValue({
                    id: 'custpage_summary_total_amount',
                    line: line,
                    value: vendorData[vendor].total_amount.toFixed(2)
                });

                totalSelectedAmount += vendorData[vendor].total_amount;
                line++;
            }

            // Add a field to display the total amount of all selected invoices
            var totalAmountField = form.addField({
                id: 'custpage_total_selected_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Total Amount of Selected Invoices'
            });

            // Set the total amount field value and make it non-editable
            totalAmountField.defaultValue = totalSelectedAmount.toFixed(2);
            totalAmountField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE // or use DISABLED if you want it to be grayed out
            });

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