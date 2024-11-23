/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/log', 'N/runtime', 'N/https'], function(record, log, runtime, https) {

    const getInputData = () => {
        const vendorDataJSON = runtime.getCurrentScript().getParameter('custscript_vendor_data_json');
        const vendorData = JSON.parse(vendorDataJSON || '[]');
        return vendorData;
    };

    const map = (mapContext) => {
        const vendor = JSON.parse(mapContext.value);

        // Create a custom record for each vendor
        const customRecord = record.create({
            type: 'customrecord_payment_batch' // Your custom record type
        });

        // Set vendor ID, total amount, currency, and date fields
        customRecord.setValue({ fieldId: 'custrecord_pb_vendor_id', value: vendor.vendor_id });
        customRecord.setValue({ fieldId: 'custrecord_pb_total_amount', value: vendor.total_amount });
        customRecord.setValue({ fieldId: 'custrecord_pb_date', value: new Date() });

        // Join the list of invoice IDs to a string (for use in the status field)
        const invoicesToPay = vendor.transaction.map(transaction => `${transaction.doc_id}: ${transaction.amount_payed}`).join('\n');
        customRecord.setValue({ fieldId: 'custrecord_pb_data', value: invoicesToPay }); // Store invoice data as a text area

        // Optionally, set the status field if needed (example status - replace with actual status if required)
        const status = 'Pending';  // Replace with the actual status or logic to determine the status
        customRecord.setValue({ fieldId: 'custrecord_pb_status', value: status });

        const recordId = customRecord.save();
        mapContext.write({ key: recordId, value: invoicesToPay }); // Pass record ID and invoice list to reduce

        log.debug('Custom Record Created', `Record ID: ${recordId}`);
    };

    const reduce = (reduceContext) => {
        const recordId = reduceContext.key;
        const invoicesList = reduceContext.values.join(''); // Invoice list from the map output

        try {
            // Process each invoice based on the list
            const invoiceIds = invoicesList.split('\n').map(line => line.split(':')[0]); // Extract invoice IDs

            invoiceIds.forEach(invoiceId => {
                try {
                    const invoiceRecord = record.load({
                        type: 'invoice',
                        id: invoiceId.trim()
                    });
                    invoiceRecord.setValue({ fieldId: 'custbody_hold_payment', value: true }); // Example - hold payment flag
                    invoiceRecord.save();
                    log.debug('Hold Payment Set', `Invoice ID: ${invoiceId}`);
                } catch (error) {
                    log.error('Error Updating Invoice', `Invoice ID: ${invoiceId}, Error: ${error}`);
                }
            });

            // Mark the custom record as processed (buddy record, as an example)
            const buddyRecord = record.create({
                type: 'customrecord_buddy_list' // Replace with your buddy list record type
            });
            buddyRecord.setValue({ fieldId: 'custrecord_buddy_processed_record', value: recordId });
            buddyRecord.setValue({ fieldId: 'custrecord_buddy_processed_date', value: new Date() });
            buddyRecord.save();

            log.debug('Buddy Record Created', `For Custom Record ID: ${recordId}`);

        } catch (error) {
            log.error('Error in Reduce Function', `Record ID: ${recordId}, Error: ${error}`);
        }
    };

    const summarize = (summaryContext) => {
        summaryContext.output.iterator().each((key, value) => {
            log.audit({ title: 'Processed Record', details: key + ': ' + value });
            return true;
        });

        if (summaryContext.errors) {
            log.error('Errors', JSON.stringify(summaryContext.errors));
        }
    };

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
