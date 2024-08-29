/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], function(url, currentRecord) {

    function updateTotalSelectedAmount() {
        var record = currentRecord.get();
        var lineCount = record.getLineCount({ sublistId: 'custpage_payment_sublist' });
        var totalSelectedAmount = 0;

        for (var i = 0; i < lineCount; i++) {
            var isSelected = record.getSublistValue({
                sublistId: 'custpage_payment_sublist',
                fieldId: 'custpage_select',
                line: i
            });

            if (isSelected) {
                var paymentAmount = parseFloat(record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_payment_amount',
                    line: i
                })) || 0;

                totalSelectedAmount += paymentAmount;
            }
        }

        // Update the total selected amount field on the form
        record.setValue({
            fieldId: 'custpage_total_selected_amount',
            value: totalSelectedAmount.toFixed(2)
        });
    }

    function fieldChanged(context) {
        var sublistId = context.sublistId;
        var fieldId = context.fieldId;

        if (sublistId === 'custpage_payment_sublist') {
            var paymentAmountFieldId = 'custpage_payment_amount';
            var amountFieldId = 'custpage_amount';
            var remainingAmountFieldId = 'custpage_amount_remaining';
            var selectFieldId = 'custpage_select';

            if (fieldId === paymentAmountFieldId || fieldId === selectFieldId) {
                var paymentAmount = parseFloat(context.currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: paymentAmountFieldId
                })) || 0;

                var totalAmount = parseFloat(context.currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: amountFieldId
                }));

                var isSelected = context.currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: selectFieldId
                });

                if (fieldId === paymentAmountFieldId) {
                    // Ensure payment amount does not exceed total amount
                    if (paymentAmount > totalAmount) {
                        alert('Payment amount cannot exceed the total amount.');
                        context.currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: paymentAmountFieldId,
                            value: totalAmount,
                            ignoreFieldChange: true
                        });
                        paymentAmount = totalAmount;
                    }

                    // Automatically select the line if payment amount is greater than 0
                    if (paymentAmount > 0 && !isSelected) {
                        context.currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: selectFieldId,
                            value: true,
                            ignoreFieldChange: true
                        });
                    }

                    // Automatically deselect the line if payment amount is set to 0
                    if (paymentAmount === 0 && isSelected) {
                        context.currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: selectFieldId,
                            value: false,
                            ignoreFieldChange: true
                        });
                    }
                }

                if (fieldId === selectFieldId) {
                    if (isSelected === true) {
                        // Set payment amount to total amount when selected
                        context.currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: paymentAmountFieldId,
                            value: totalAmount,
                            ignoreFieldChange: true
                        });
                    } else {
                        // Reset payment amount to 0 when deselected
                        context.currentRecord.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: paymentAmountFieldId,
                            value: 0,
                            ignoreFieldChange: true
                        });
                    }
                }

                // Update remaining amount
                var remainingAmount = totalAmount - paymentAmount;

                context.currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: remainingAmountFieldId,
                    value: remainingAmount.toFixed(2),
                    ignoreFieldChange: true
                });

                // Update the total selected amount
                updateTotalSelectedAmount();
            }
        }
    }

    function onNextClick() {
        var record = currentRecord.get();
        var lineCount = record.getLineCount({ sublistId: 'custpage_payment_sublist' });
        var vendorData = {};

        for (var i = 0; i < lineCount; i++) {
            var isSelected = record.getSublistValue({
                sublistId: 'custpage_payment_sublist',
                fieldId: 'custpage_select',
                line: i
            });

            if (isSelected === true) {
                var vendorId = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_name',
                    line: i
                });

                var docId = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_document_number',
                    line: i
                });

                var amountPayed = parseFloat(record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_payment_amount',
                    line: i
                }));

                var docName = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_document_number',
                    line: i
                });

                var currency = record.getSublistValue({
                    sublistId: 'custpage_payment_sublist',
                    fieldId: 'custpage_currency',
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

        // Convert doc_payed array to a comma-separated string
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

        // Override the onbeforeunload event to prevent the pop-up
        window.onbeforeunload = null;

        window.location.href = redirectUrl;
    }

    function pageInit() {
        // Override the onbeforeunload event to prevent the pop-up
        window.onbeforeunload = null;

        document.getElementById('custpage_next').onclick = onNextClick;
    }

    return {
        fieldChanged: fieldChanged,
        pageInit: pageInit
    };
});