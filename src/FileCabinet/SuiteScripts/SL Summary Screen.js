/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/log', 'N/record', 'N/task', 'N/search', 'N/url'], 
    function(serverWidget, log, record, task, search, url) {

        function onRequest(context) {
            var form = serverWidget.createForm({
                title: 'Payment Summary Screen'
            });

            // Get vendor data from the URL parameters (passed from previous screen)
            var vendorData = JSON.parse(context.request.parameters.vendorData);

            // Add a sublist for the invoice summary
            var sublist = form.addSublist({
                id: 'custpage_invoice_summary_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Invoice Summary'
            });

            sublist.addField({
                id: 'custpage_vendor_name',
                type: serverWidget.FieldType.TEXT,
                label: 'Vendor Name'
            });

            sublist.addField({
                id: 'custpage_vendor_currency',
                type: serverWidget.FieldType.TEXT,
                label: 'Currency'
            });

            sublist.addField({
                id: 'custpage_invoice',
                type: serverWidget.FieldType.TEXT,
                label: 'Invoice'
            });

            sublist.addField({
                id: 'custpage_total_amount_paid',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Total Amount Paid'
            });

            sublist.addField({
                id: 'custpage_payment_status',
                type: serverWidget.FieldType.TEXT,
                label: 'Payment Status'
            });

            var totalAmount = 0; // To calculate the total amount of all invoices
            var isSubmitted = false; // To track if the payment has been submitted

            // Check if the request is a POST, indicating the Submit button was clicked
            if (context.request.method === 'POST') {
                var vendorDataToUpdate = [];

                // Iterate over each line to update the Payment Hold status and collect data for Map/Reduce
                for (var i = 0; i < vendorData.length; i++) {
                    var vendor = vendorData[i];
                    var isUpdated = false;

                    vendor.doc_payed.split(', ').forEach(function(invoice) {
                        // Update the Payment Hold on the vendor bill (set to true)
                        var vendorRecord = record.load({
                            type: record.Type.VENDOR_BILL,
                            id: vendor.vendor_id
                        });

                        // Set the Payment Hold to true
                        vendorRecord.setValue({
                            fieldId: 'custbody_payment_hold',
                            value: true
                        });

                        // Save the updated vendor bill
                        vendorRecord.save();

                        vendorDataToUpdate.push({
                            vendor_id: vendor.vendor_id,
                            vendor_name: vendor.vendor,
                            payment_status: 'Payment Hold Updated'
                        });

                        // Update the status in the sublist
                        sublist.setSublistValue({
                            id: 'custpage_payment_status',
                            line: i,
                            value: 'Payment Hold Updated' // Status after update
                        });

                        isUpdated = true;
                    });

                    if (isUpdated) {
                        isSubmitted = true; // Mark as submitted
                    }
                }

                // Trigger the Map/Reduce script for further processing (if necessary)
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_mr_create_payment_batch',
                    deploymentId: 'customdeploy_mr_create_payment_batch_2',
                    params: {
                        vendorData: JSON.stringify(vendorDataToUpdate)
                    }
                });

                var taskId = mrTask.submit();
            }

            // Add the data from the vendorData JSON to the sublist
            var line = 0;
            vendorData.forEach(function(vendor) {
                vendor.doc_payed.split(', ').forEach(function(invoice) {
                    sublist.setSublistValue({
                        id: 'custpage_vendor_name',
                        line: line,
                        value: vendor.vendor
                    });

                    sublist.setSublistValue({
                        id: 'custpage_vendor_currency',
                        line: line,
                        value: vendor.currency
                    });

                    sublist.setSublistValue({
                        id: 'custpage_invoice',
                        line: line,
                        value: invoice
                    });

                    sublist.setSublistValue({
                        id: 'custpage_total_amount_paid',
                        line: line,
                        value: vendor.total_amount
                    });

                    sublist.setSublistValue({
                        id: 'custpage_payment_status',
                        line: line,
                        value: isSubmitted ? 'Payment Hold Updated' : 'Pending Update'
                    });

                    totalAmount += vendor.total_amount;
                    line++;
                });
            });

            // Add a headline for "Total Payment Amount"
            form.addField({
                id: 'custpage_total_payment_amount_heading',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Total Payment Amount Heading'
            }).defaultValue = `
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                    Total Payment Amount
                </div>
            `;

            // Add a custom field for the total amount with inline HTML for styling
            form.addField({
                id: 'custpage_total_amount_html',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Total Amount of All Invoices'
            }).defaultValue = `
                <div style="background-color: #f2f2f2; padding: 10px; font-size: 16px; color: black; border-radius: 4px;">
                    <strong>${totalAmount.toFixed(2)}</strong>
                </div>
            `;

            // Add a Submit Payment button
            form.addButton({
                id: 'custpage_submit_payment',
                label: isSubmitted ? 'Payment Submitted' : 'Submit Payment',
                functionName: 'onSubmitPaymentClick'
            });

            // Disable the Submit Payment button after it's pressed
            if (isSubmitted) {
                form.getField({
                    id: 'custpage_submit_payment'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
            }

            // Client script for handling the submit payment button
            form.clientScriptModulePath = '/SuiteScripts/cs_payment_submission.js';

            // Display a confirmation message if the payment was successfully processed
            if (isSubmitted) {
                form.addField({
                    id: 'custpage_confirmation_message',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Confirmation'
                }).defaultValue = '<div style="color: green;">Payment Hold has been successfully updated for the selected invoices.</div>';
            }

            // Write the form to the response
            context.response.writePage(form);
        }

        return {
            onRequest: onRequest
        };
    });
