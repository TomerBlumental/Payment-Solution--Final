/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/ui/serverWidget', 'N/redirect','N/runtime', 'N/log'], function(record, serverWidget, redirect, runtime,log) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var recordId = context.request.parameters.recordId;
            if (!recordId) {
                context.response.write('Missing record ID');
                return;
            }
            var currentUser = runtime.getCurrentUser().id;

            var form = serverWidget.createForm({
                title: 'Provide Rejection Reason'
            });
            form.addField({
                id: 'custpage_rejection_reason',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Rejection Reason'
            }).isMandatory = true;
            form.addSubmitButton({
                label: 'Submit'
            });
            form.addField({
                id: 'custpage_record_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Record ID'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            }).defaultValue = recordId;
            form.addField({
                id: 'custpage_user',
                type: serverWidget.FieldType.TEXT,
                label: 'User'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            }).defaultValue = currentUser;
            context.response.writePage(form);

        } else if (context.request.method === 'POST') {
            // Handle form submission
            var rejectionReason = context.request.parameters.custpage_rejection_reason;
            var recordId = context.request.parameters.custpage_record_id;
            var user = context.request.parameters.custpage_user;


            if (!recordId) {
                context.response.write('Missing record ID');
                return;
            }

            try {
                record.submitFields({
                    type: 'customrecord_vendor_bank_detail',
                    id: recordId,
                    values: {
                        custrecord_vbd_rejection_reason: rejectionReason,
                        custrecord_vbd_approval_status: 5,
                        custrecord_vbd_reject_by: user

                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

                log.debug('Record Updated', 'Record has been successfully updated with rejection reason');

                // Redirect to a confirmation page or the record view page
                redirect.toRecord({
                    type: 'customrecord_vendor_bank_detail',
                    id: recordId
                });

            } catch (e) {
                log.error({
                    title: 'Error Updating Record',
                    details: e.message
                });
                context.response.write('Error updating record: ' + e.message);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});
