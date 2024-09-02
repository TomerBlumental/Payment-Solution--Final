/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime', 'N/log', 'N/record'], function(runtime, log, record) {

    /**
     * Defines the function that provides the input data for the Map/Reduce process.
     * @returns {Array|Object|Search|RecordRef} The input data to be processed in the map phase.
     */
    function getInputData() {
        // Retrieve the JSON data from the script parameter
        var vendorDataJson = runtime.getCurrentScript().getParameter({ name: 'custscript_vendor_data_json' });
        var vendorData = JSON.parse(vendorDataJson);

        // Convert the vendor data into an array for processing in the map phase
        return Object.keys(vendorData).map(function(key) {
            return {
                key: key,
                data: vendorData[key]
            };
        });
    }

    /**
     * Defines the function that is executed when the map entry point is triggered.
     * @param {Object} context - Data provided to the map stage.
     */
    function map(context) {
        var value = JSON.parse(context.value);

        // Log each vendor's data
        log.debug('Processing Vendor', value.key);

        // Create and save the batch file record (relating to your provided code snippet)
        let batch_file = record.create({
            type: 'customrecord_payment_batch', // Custom record type to store batch data
            isDynamic: false
        });
        batch_file.setValue({
            fieldId: 'custrecord_pb_data',
            value: value.key // Set the task or relevant identifier; adjust as needed
        });
        let batch_file_id = batch_file.save();

        log.debug('Batch File Created', `Batch File ID: ${batch_file_id}`);

        // Pass processed data to the reduce stage
        context.write({
            key: value.key,
            value: {
                data: value.data,
                batchFileId: batch_file_id // Passing the batch file ID to reduce
            }
        });
    }

    /**
     * Defines the function that is executed when the reduce entry point is triggered.
     * @param {Object} context - Data provided to the reduce stage.
     */
    function reduce(context) {
        log.debug('Reducing Data', `Vendor: ${context.key}`);
        var totalAmount = 0;

        context.values.forEach(function(value) {
            var data = JSON.parse(value).data;
            totalAmount += data.total_amount;
        });

        log.debug('Total Amount for Vendor', `${context.key}: ${totalAmount.toFixed(2)}`);
    }

    /**
     * Defines the function that is executed when the summarize entry point is triggered.
     * @param {Object} summary - Holds statistics about the entire map/reduce process.
     */
    function summarize(summary) {
        log.debug('Summarize Phase', 'Map/Reduce script completed successfully.');
        summary.mapSummary.errors.iterator().each(function(key, error) {
            log.error(`Map Error: ${key}`, error);
            return true;
        });
        summary.reduceSummary.errors.iterator().each(function(key, error) {
            log.error(`Reduce Error: ${key}`, error);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});