/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/log', 'N/ui/message'], function(currentRecord, log, message) {

    // Page initialization function (used to set up the page initially)
    function pageInit(context) {
        // You can initialize things here if needed
    }

    // This function handles the click event for the Submit Payment button
    function onSubmitPaymentClick() {
        var record = currentRecord.get();

        // Disable the Submit Payment button to prevent multiple submissions
        var submitButton = document.getElementById('custpage_submit_payment');
        if (submitButton) {
            submitButton.disabled = true; // Disable the button
        }

        // Programmatically submit the form (POST request to the Suitelet)
        record.save().then(function() {
            // Optionally display a success message after the form is submitted
            message.create({
                title: "Success",
                message: "Payment has been submitted and is being processed.",
                type: message.Type.CONFIRMATION
            }).show();
        }).catch(function(e) {
            // Handle any errors
            message.create({
                title: "Error",
                message: "An error occurred while processing the payment. Please try again.",
                type: message.Type.ERROR
            }).show();
            log.error({
                title: "Error submitting payment",
                details: e
            });
        });
    }

    return {
        pageInit: pageInit,  // Page initialization entry point
        onSubmitPaymentClick: onSubmitPaymentClick  // Custom button click handler
    };
});
