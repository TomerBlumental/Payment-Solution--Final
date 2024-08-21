/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], function(url, currentRecord) {

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

                if (fieldId === paymentAmountFieldId && paymentAmount > 0) {
                    context.currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: selectFieldId,
                        value: true,
                        ignoreFieldChange: true
                    });
                }

                if (isSelected === true && fieldId === selectFieldId) {
                    paymentAmount = totalAmount;
                    context.currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: paymentAmountFieldId,
                        value: paymentAmount,
                        ignoreFieldChange: true
                    });
                }

                // Reset payment amount to zero and update amount remaining if checkbox is deselected
                if (isSelected === false && fieldId === selectFieldId) {
                    paymentAmount = 0;
                    context.currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: paymentAmountFieldId,
                        value: paymentAmount,
                        ignoreFieldChange: true
                    });
                }

                var remainingAmount = totalAmount - paymentAmount;

                context.currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: remainingAmountFieldId,
                    value: remainingAmount.toFixed(2),
                    ignoreFieldChange: true
                });
            }
        }
    }

    function onNextClick() {
        var record = currentRecord.get();
        var lineCount = record.getLineCount({ sublistId: 'custpage_payment_sublist' });
        var selectedLines = [];

        for (var i = 0; i < lineCount; i++) {
            var isSelected = record.getSublistValue({
                sublistId: 'custpage_payment_sublist',
                fieldId: 'custpage_select',
                line: i
            });

            if (isSelected === true) {
                selectedLines.push({
                    date: record.getSublistValue({ sublistId: 'custpage_payment_sublist', fieldId: 'custpage_date', line: i }),
                    name: record.getSublistValue({ sublistId: 'custpage_payment_sublist', fieldId: 'custpage_name', line: i }),
                    documentNumber: record.getSublistValue({ sublistId: 'custpage_payment_sublist', fieldId: 'custpage_document_number', line: i }),
                    currency: record.getSublistValue({ sublistId: 'custpage_payment_sublist', fieldId: 'custpage_currency', line: i }),
                    amount: record.getSublistValue({ sublistId: 'custpage_payment_sublist', fieldId: 'custpage_amount', line: i }),
                    paymentAmount: record.getSublistValue({ sublistId: 'custpage_payment_sublist', fieldId: 'custpage_payment_amount', line: i })
                });
            }
        }

        var redirectUrl = url.resolveScript({
            scriptId: 'customscript_summary_page', 
            deploymentId: 'customdeploy_summary_page', 
            params: { selectedLines: JSON.stringify(selectedLines) }
        });

        window.location.href = redirectUrl;
    }

    return {
        fieldChanged: fieldChanged,
        pageInit: function() {
            document.getElementById('custpage_next').onclick = onNextClick;
        }
    };
});