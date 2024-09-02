/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], function(url, currentRecord) {

    function fieldChanged(context) {
        var record = context.currentRecord;
        var sublistId = context.sublistId;
        var fieldId = context.fieldId;

        if (sublistId === 'custpage_payment_sublist') {
            var paymentAmountFieldId = 'custpage_paymentamountfield';
            var amountFieldId = 'custpage_amountfield';
            var selectFieldId = 'custpage_selectfield';
            var amountRemainingFieldId = 'custpage_amountremainingfield';

            var paymentAmount = parseFloat(record.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: paymentAmountFieldId
            })) || 0;

            var totalAmount = parseFloat(record.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: amountFieldId
            })) || 0;

            var isSelected = record.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: selectFieldId
            });

            // Handle changes to the checkbox
            if (fieldId === selectFieldId) {
                if (isSelected) {
                    // Set Payment Amount to Total Amount when selected
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: paymentAmountFieldId,
                        value: totalAmount,
                        ignoreFieldChange: true
                    });

                    // Set Amount Remaining to 0
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: amountRemainingFieldId,
                        value: 0,
                        ignoreFieldChange: true
                    });
                } else {
                    // Reset Payment Amount to 0 when deselected
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: paymentAmountFieldId,
                        value: 0,
                        ignoreFieldChange: true
                    });

                    // Set Amount Remaining to the Total Amount
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: amountRemainingFieldId,
                        value: totalAmount,
                        ignoreFieldChange: true
                    });
                }
            }

            // Handle changes to the Payment Amount
            if (fieldId === paymentAmountFieldId) {
                if (paymentAmount > totalAmount) {
                    alert('Payment amount cannot exceed the total amount.');
                    paymentAmount = totalAmount;
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: paymentAmountFieldId,
                        value: paymentAmount,
                        ignoreFieldChange: true
                    });
                }

                // Update the Amount Remaining based on the new Payment Amount
                var amountRemaining = totalAmount - paymentAmount;
                record.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: amountRemainingFieldId,
                    value: amountRemaining,
                    ignoreFieldChange: true
                });

                // Automatically select the checkbox if payment amount > 0
                if (paymentAmount > 0 && !isSelected) {
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: selectFieldId,
                        value: true,
                        ignoreFieldChange: true
                    });
                }

                // Automatically deselect the checkbox if payment amount is 0
                if (paymentAmount === 0 && isSelected) {
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: selectFieldId,
                        value: false,
                        ignoreFieldChange: true
                    });
                }
            }
        }
    }

    function pageInit(context) {
        // Ensure page setup logic remains intact
        window.onbeforeunload = null;
        var nextButton = document.getElementById('custpage_next');
        if (nextButton) {
            nextButton.onclick = onNextClick;
        } else {
            console.error('Next button not found.');
        }
    }

    function onNextClick() {
        var record = currentRecord.get();
        var lineCount = record.getLineCount({ sublistId: 'custpage_payment_sublist' });
        var vendorData = {};

        for (var i = 0; i < lineCount; i++) {
            var isSelected = record.getSublistValue({
                sublistId: 'custpage_payment_sublist',
                fieldId: 'custpage_selectfield',
                line: i
            });

            if (isSelected) {
                var vendorId = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_namefield',
                    line: i
                });

                var docId = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_documentnumberfield',
                    line: i
                });

                var amountPayed = parseFloat(record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_paymentamountfield',
                    line: i
                })) || 0;

                var docName = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_documentnumberfield',
                    line: i
                });

                var currency = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_currencyfield',
                    line: i
                });

                if (!vendorData[vendorId]) {
                    vendorData[vendorId] = {
                        vendor: vendorId,
                        currency: currency,
                        transaction: [],
                        total_amount: 0,
                        doc_payed: []
                    };
                }

                vendorData[vendorId].transaction.push({
                    doc_id: docId,
                    amount_payed: amountPayed,
                    doc_name: docName
                });

                vendorData[vendorId].total_amount += amountPayed;
                vendorData[vendorId].doc_payed.push(docName);
            }
        }

        for (var vendor in vendorData) {
            if (vendorData[vendor].doc_payed.length) {
                vendorData[vendor].doc_payed = vendorData[vendor].doc_payed.join(', ');
            }
        }

        var redirectUrl = url.resolveScript({
            scriptId: 'customscript_summary_page', 
            deploymentId: 'customdeploy_summary_page', 
            params: { vendorData: JSON.stringify(vendorData) }
        });

        window.onbeforeunload = null;
        window.location.href = redirectUrl;
    }

    return {
        fieldChanged: fieldChanged,
        pageInit: pageInit
    };
});