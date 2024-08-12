/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/ui/message', 'N/url','N/log', 'N/runtime','N/ui/dialog', './DS/Bank_approval_function'], 
    function(currentRecord, record, message,url, log, runtime,dialog, bank) {
        let payment_type = null
        function pageInit(context) {
            var currentRecordObj = context.currentRecord;
            payment_type = currentRecordObj.getValue({ fieldId: 'custrecord_vbd_payment_type' });
            set_field_display(bank.get_field_to_hide(payment_type),false);
            set_field_mandatory(bank.get_mandatory_field(payment_type),true);
        }
        function fieldChanged(context) {
            var currentRecordObj = context.currentRecord;
            var fieldId = context.fieldId;
            if (fieldId === 'custrecord_vbd_payment_type') {
                var new_payment_type = currentRecordObj.getValue({ fieldId: fieldId });
                set_field_display(bank.get_field_to_hide(payment_type),true);
                set_field_display(bank.get_field_to_hide(new_payment_type),false);
                set_field_mandatory(bank.get_mandatory_field(payment_type),false);
                set_field_mandatory(bank.get_mandatory_field(new_payment_type),true);
                payment_type = new_payment_type;
            }
        }
        function approveRecord(context) {
            log.debug('approveRecord', 'Function entered');
            try {
                let update_bank_detail = {};
                let current_rec_id = currentRecord.get().id
                let rec = record.load({
                    type: 'customrecord_vendor_bank_detail',
                    id: current_rec_id
                });
                var subsidiary = rec.getValue('custrecord_vbd_subsidiary');
                var firstApprover = rec.getValue('custrecord_vbd_first_approver');
                let payment_type = rec.getValue('custrecord_vbd_payment_type');
                var currentUser = runtime.getCurrentUser().id;
                if (bank.isNullOrEmpty(firstApprover)) {
                    // First approval
                    var nextApprover = bank.get_bank_approver(subsidiary, 'custrecord_vba_second_approver', currentUser);
                    update_bank_detail.custrecord_vbd_first_approver = currentUser;
                    update_bank_detail.custrecord_vbd_available_approver = nextApprover;
                    update_bank_detail.custrecord_vbd_approval_status = 3;
                } else {
                    // Second approval
                    let vendor_id = rec.getValue('custrecord_vbd_vendor');
                    let update_vendor = {}
                    if(payment_type == 1){
                        update_vendor.custentity_il_bank_branch_number = rec.getValue('custrecord_vbd_il_branch');
                        update_vendor.custentity_il_bank_account_number =  rec.getValue('custrecord_vbd_account_number');
                    }
                    if(payment_type == 2){
                        let bank_fi_id = rec.getValue('custrecord_vbd_fi_bank_detail');
                        let bank_fi = null
                        if(bank.isNullOrEmpty(bank_fi_id)){
                            bank_fi = record.create({
                                type: 'customrecord_fispan_vendor_bank_details',
                                isDynamic: true,
                            });
                        }else{
                            bank_fi = record.load({
                                type: 'customrecord_fispan_vendor_bank_details',
                                id: bank_fi_id,
                                isDynamic: true,
                            })
                        } 
                        let country = rec.getValue('custrecord_vbd_country')
                        let currency_name = rec.getText('custrecord_vbd_currency');
                        let vendor_name = rec.getText('custrecord_vbd_vendor');
                        let full_name = vendor_name + '-' + currency_name;
                        bank_fi.setValue('name',full_name);
                        bank_fi.setValue('custrecord_fispan_vbd_label',full_name);
                        bank_fi.setValue('custrecord_fispan_vbd_vendor',vendor_id);
                        bank_fi.setValue('custrecord_fi_lock_record',false);
                        bank_fi.setValue('custrecord_fispan_vbd_currency',rec.getText('custrecord_vbd_currency'));
                        bank_fi.setValue('custrecord_fispan_vbd_country',bank.get_country_code(country));
                        bank_fi.setValue('custrecord_fispan_vbd_primary',true);
                        bank_fi.setValue('custrecord_fispan_vbd_method',rec.getValue('custrecord_vbd_transfer_method_type'));
                        bank_fi.setValue('custrecord_fispan_vbd_type','VENDOR');
                        bank_fi.setValue('custrecord_fispan_vbd_payment_data',bank.build_json_fi(rec));
                        let bank_fi_created = bank_fi.save()
                        update_bank_detail.custrecord_vbd_fi_bank_detail = bank_fi_created;
                        log.debug({
                            title: 'bank_fi_created',
                            details: bank_fi_created
                        })
                    }
                    update_vendor.custentity_mis_vendor_holdpayemnt = false
                    update_vendor.custentity_vendor_payment_processor = payment_type
                    record.submitFields({
                        type: 'vendor',
                        id: vendor_id,
                        values: update_vendor,
                        options: {
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        }
                    });
                    update_bank_detail.custrecord_vbd_second_approver = currentUser;
                    update_bank_detail.custrecord_vbd_approval_status = 4;
                    update_bank_detail.custrecord_vbd_bank_rec_update = true
                }
                record.submitFields({
                    type: 'customrecord_vendor_bank_detail',
                    id: rec.id,
                    values: update_bank_detail,
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });
                location.reload(); // Refresh the page to reflect the changes
            } catch (e) {
                log.error({
                    title: 'Error Approving Record',
                    details: e.message
                });
                message.create({
                    title: 'Error',
                    message: 'There was an error approving the record: ' + e.message,
                    type: message.Type.ERROR
                }).show({
                    duration: 5000
                });
            }
        }
        function rejectRecord() {
            let current_rec_id = currentRecord.get().id
            dialog.confirm({
                title: 'Confirm Rejection',
                message: 'Are you sure you want to reject this record?'
            }).then(function(result) {
                log.debug('Dialog Result', 'User confirmed: ' + result);
                if (result) {
                    var suiteletUrl = url.resolveScript({
                        scriptId: 'customscript_rejection_ven_bank_detail',
                        deploymentId: 'customdeploy_reject_ven_bank_detail',
                        params: {
                            recordId: current_rec_id
                        }
                    });
                    window.location.href = suiteletUrl;
                } else {
                    log.debug('User Action', 'User canceled the action');
                }
            }).catch(function(reason) {
                log.error({
                    title: 'Dialog Error',
                    details: reason
                });
            });
        }
        function set_field_display(fieldIds, status) {
            var rec = currentRecord.get();
            fieldIds.forEach(function(fieldId) {
                try {
                    rec.getField({ fieldId: fieldId }).isDisplay = status;
                } catch (e) {
                    log.error('Error Hiding Field', 'Error hiding field ID: ' + fieldId + ' - ' + e.message);
                }
            });
        }
        function set_field_mandatory(fieldIds, status) {
            var rec = currentRecord.get();
            fieldIds.forEach(function(fieldId) {
                try {
                    rec.getField({ fieldId: fieldId }).isMandatory  = status;
                } catch (e) {
                    log.error('Error Setting Field Mandatory', 'Error setting field ID: ' + fieldId + ' as mandatory - ' + e.message);
                }
            });
        }
        
      

        return {
            pageInit: pageInit,
            approveRecord: approveRecord,
            rejectRecord: rejectRecord,
            fieldChanged: fieldChanged,
        };
    }
);
