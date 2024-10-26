/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/log'], function(url, currentRecord, log) {

    var totalAmountCache = {}; // Cache for total amounts
    var paymentAmountCache = {}; // Cache for payment amounts
    var amountRemainingCache = {}; // Cache for amount remaining values

    function fieldChanged(context) {
        var record = context.currentRecord;
        var sublistId = context.sublistId;
        var fieldId = context.fieldId;

        if (sublistId === 'custpage_payment_sublist') {
            var line = context.line;

            // Fetch the cached total amount for the line
            var totalAmount = totalAmountCache[line];
            if (typeof totalAmount === 'undefined') {
                totalAmount = parseFloat(record.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_amountfield'
                })) || 0;
                totalAmountCache[line] = totalAmount;
            }

            // If Payment Amount is changed, update Amount Remaining and handle negative values
            if (fieldId === 'custpage_paymentamountfield') {
                var paymentAmount = parseFloat(record.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_paymentamountfield'
                })) || 0;

                if (paymentAmount < 0) {
                    alert('Payment amount cannot be negative.');
                    paymentAmount = 0;
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custpage_paymentamountfield',
                        value: paymentAmount,
                        ignoreFieldChange: true
                    });
                }

                if (paymentAmount > totalAmount) {
                    alert('Payment amount cannot exceed the total amount.');
                    paymentAmount = totalAmount;
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custpage_paymentamountfield',
                        value: paymentAmount,
                        ignoreFieldChange: true
                    });
                }

                paymentAmountCache[line] = paymentAmount;
                var amountRemaining = totalAmount - paymentAmount;
                record.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_amountremainingfield',
                    value: amountRemaining,
                    ignoreFieldChange: true
                });
                amountRemainingCache[line] = amountRemaining;

                var isSelected = paymentAmount > 0 || amountRemaining < totalAmount;
                record.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_selectfield',
                    value: isSelected,
                    ignoreFieldChange: true
                });
            }

            // If Amount Remaining is changed, update Payment Amount
            if (fieldId === 'custpage_amountremainingfield') {
                var amountRemaining = parseFloat(record.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_amountremainingfield'
                })) || 0;

                if (amountRemaining < 0) {
                    alert('Amount remaining cannot be negative.');
                    amountRemaining = 0;
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custpage_amountremainingfield',
                        value: amountRemaining,
                        ignoreFieldChange: true
                    });
                }

                if (amountRemaining > totalAmount) {
                    alert('Amount remaining cannot exceed the total amount.');
                    amountRemaining = totalAmount;
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custpage_amountremainingfield',
                        value: amountRemaining,
                        ignoreFieldChange: true
                    });
                }

                amountRemainingCache[line] = amountRemaining;
                var paymentAmount = totalAmount - amountRemaining;
                record.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_paymentamountfield',
                    value: paymentAmount,
                    ignoreFieldChange: true
                });
                paymentAmountCache[line] = paymentAmount;

                var isSelected = paymentAmount > 0 || amountRemaining < totalAmount;
                record.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_selectfield',
                    value: isSelected,
                    ignoreFieldChange: true
                });
            }

            // Checkbox selected manually: fill Payment Amount with Total Amount, set Amount Remaining to 0
            if (fieldId === 'custpage_selectfield') {
                var isSelected = record.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_selectfield'
                });

                if (isSelected) {
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custpage_paymentamountfield',
                        value: totalAmount,
                        ignoreFieldChange: true
                    });
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custpage_amountremainingfield',
                        value: 0,
                        ignoreFieldChange: true
                    });
                    paymentAmountCache[line] = totalAmount;
                    amountRemainingCache[line] = 0;
                } else {
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custpage_paymentamountfield',
                        value: 0,
                        ignoreFieldChange: true
                    });
                    record.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custpage_amountremainingfield',
                        value: totalAmount,
                        ignoreFieldChange: true
                    });
                    paymentAmountCache[line] = 0;
                    amountRemainingCache[line] = totalAmount;
                }
            }
        }
    }

    function pageInit(context) {
        var record = context.currentRecord;
        var sublistId = 'custpage_payment_sublist';
        var lineCount = record.getLineCount({ sublistId: sublistId });

        for (var i = 0; i < lineCount; i++) {
            var totalAmount = parseFloat(record.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custpage_amountfield',
                line: i
            })) || 0;

            totalAmountCache[i] = totalAmount;
            paymentAmountCache[i] = 0;
            amountRemainingCache[i] = totalAmount;

            record.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custpage_amountremainingfield',
                line: i,
                value: totalAmount
            });
        }

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
        var vendorData = [];

        for (var i = 0; i < lineCount; i++) {
            var isSelected = record.getSublistValue({
                sublistId: 'custpage_payment_sublist',
                fieldId: 'custpage_selectfield',
                line: i
            });

            var paymentAmount = paymentAmountCache[i] || 0;
            var amountRemaining = amountRemainingCache[i] || totalAmountCache[i];

            if (isSelected || paymentAmount > 0 || amountRemaining < totalAmountCache[i]) {
                var vendorName = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_namefield',
                    line: i
                });

                var vendorId = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_vendoridfield', // Now matches the Vendor ID field in the Suitelet
                    line: i
                });

                var docId = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_documentnumberfield',
                    line: i
                });

                var currency = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_currencyfield',
                    line: i
                });

                var currencyId = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_currencyidfield', // Now matches the Currency ID field in the Suitelet
                    line: i
                });

                var vendor = vendorData.find(v => v.vendor === vendorName);
                if (!vendor) {
                    vendor = {
                        vendor: vendorName,
                        vendor_id: vendorId,
                        currency: currency,
                        currency_id: currencyId,
                        transaction: [],
                        total_amount: 0,
                        doc_payed: []
                    };
                    vendorData.push(vendor);
                }

                vendor.transaction.push({
                    doc_id: docId,
                    amount_payed: paymentAmount,
                    doc_name: docId
                });

                vendor.total_amount += paymentAmount;
                vendor.doc_payed.push(docId);
            }
        }

        vendorData.forEach(vendor => {
            vendor.doc_payed = vendor.doc_payed.join(', ');
        });

        // Log JSON data to Script Execution Log
        log.debug({
            title: 'Vendor Data JSON with IDs',
            details: JSON.stringify(vendorData)
        });

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
