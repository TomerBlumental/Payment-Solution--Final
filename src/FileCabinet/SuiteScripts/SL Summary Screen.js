/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/format', 'N/task', 'N/log'], function(serverWidget, format, task, log) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            // Display the summary form (your existing GET logic)
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

            var totalAmountField = form.addField({
                id: 'custpage_total_selected_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Total Amount of Selected Invoices'
            });

            totalAmountField.defaultValue = totalSelectedAmount.toFixed(2);
            totalAmountField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            form.addSubmitButton({
                label: 'Submit Final Batch'
            });

            context.response.writePage(form);

        } else if (context.request.method === 'POST') {
            // Handle form submission when the "Submit Final Batch" button is clicked
            try {
                // Retrieve the vendorData JSON from the request parameters
                var vendorData = context.request.parameters.vendorData;

                // Schedule the Map/Reduce script and pass the JSON as a parameter
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_cash_app_v2', // Your script ID
                    deploymentId: 'customdeploy_cash_app_2', // Your deployment ID
                    params: {
                        custscript_vendor_data_json: vendorData // Pass the JSON data to the script
                    }
                });

                // Submit the Map/Reduce task
                var taskId = mrTask.submit();
                log.debug('Map/Reduce Task Submitted', `Task ID: ${taskId}`);
                context.response.write('Batch submitted successfully!');

            } catch (error) {
                log.error('Error Submitting Batch', error);
                context.response.write('There was an error submitting the batch. Please try again.');
            }
        }
    }

    return {
        onRequest: onRequest
    };
});