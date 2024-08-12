/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/url', 'N/ui/serverWidget', 'N/file', 'N/search', 'N/log', './DS/DS_utility','./DS/Bank_approval_function', 'N/runtime'], function(record, url, serverWidget, file, search, log, ds,bank, runtime) {
    function beforeLoad(context) {
        if (context.type != context.UserEventType.DELETE) {
            const form = context.form;
            var fileId = context.newRecord.getValue('custrecord_vbd_bank_detail_attachment');
            var rec_status = context.newRecord.getValue('custrecord_vbd_approval_status');
            if(rec_status == 2 || rec_status == 3 ){
                addApproveRejectButtons(context);
            }
            if (!ds.isNullOrEmpty(fileId)) {
                var pdfFile = file.load({
                    id: fileId
                });
                var elements = form.getTabs();
                log.debug('Tabs Found', elements);
                var pdfViewerField = form.addField({
                    id: 'custpage_pdf_viewer',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'PDF Viewer',
                    container :  'custom790'
                });
                var pdfUrl = pdfFile.url;
                pdfViewerField.defaultValue = '<iframe src="' + pdfUrl + '" width="100%" height="600px"></iframe>';
               
            }
            form.clientScriptModulePath = "SuiteScripts/Vendor_Approval_Bank_Detail_CS.js"   
            if(context.type == context.UserEventType.VIEW){
                var payment_type = context.newRecord.getValue('custrecord_vbd_payment_type');
                bank.change_field_display(form,bank.get_field_to_hide(payment_type),'HIDDEN');
            }
        }
    }

    function beforeSubmit(context) {
        var newRecord = context.newRecord;
        let avilable_approver = newRecord.getValue('custrecord_vbd_available_approver');
        if (avilable_approver.length == 0) {
            let subsidiary = newRecord.getValue('custrecord_vbd_subsidiary');
            let approver = bank.get_bank_approver(subsidiary, 'custrecord_vba_first_approver');
            if(approver.length > 0){
                newRecord.setValue('custrecord_vbd_available_approver', approver);
            }
        }
    }

    function afterSubmit(context) {
        try {
            var newRecord = context.newRecord;
            var recordId = newRecord.id;
            let bank_detail = newRecord.getValue('custrecord_vbd_bank_detail_attachment');
            if (ds.isNullOrEmpty(bank_detail)) {
                let file_id = null
                let bank_detail_file_id = newRecord.getValue('custrecord_vbd_file_id');
                if(!ds.isNullOrEmpty(bank_detail_file_id)){
                    file_id = bank_detail_file_id
                }else{
                    file_id = get_last_file(recordId);
                }
                if (!ds.isNullOrEmpty(file_id)) {
                    var recordToUpdate = record.load({
                        type: 'customrecord_vendor_bank_detail',
                        id: recordId
                    });
                    recordToUpdate.setValue({
                        fieldId: 'custrecord_vbd_bank_detail_attachment',
                        value: file_id
                    });
                    recordToUpdate.save();
                }
            }
        } catch (e) {
            log.error({
                title: 'Error in afterSubmit',
                details: e.message
            });
        }
    }

    function get_last_file(recordId) {
        var customrecord_vendor_bank_detailSearchObj = search.create({
            type: "customrecord_vendor_bank_detail",
            filters: [
                ['internalid', 'is', recordId]
            ],
            columns: [
                search.createColumn({
                    name: "internalid",
                    join: "file"
                }),
                search.createColumn({
                    name: "created",
                    join: "file",
                    sort: search.Sort.DESC
                })
            ]
        });
        var searchResult = customrecord_vendor_bank_detailSearchObj.run().getRange({ start: 0, end: 1 });
        if (searchResult.length > 0) {
            var latestFileId = searchResult[0].getValue({ name: "internalid", join: "file" });
            return latestFileId;
        } else {
            return null;
        }
    }
    function addApproveRejectButtons(context) {
        var form = context.form;
        var currentUser = runtime.getCurrentUser().id;
        var availableApprovers = context.newRecord.getValue('custrecord_vbd_available_approver');
         if (Array.isArray(availableApprovers)) {
            var approverArray = availableApprovers.map(Number);
           if (approverArray.includes(currentUser)) {
                form.addButton({
                    id: 'custpage_approve_button',
                    label: 'Approve',
                    functionName: 'approveRecord'
                });
                form.addButton({
                    id: 'custpage_reject_button',
                    label: 'Reject',
                    functionName: 'rejectRecord'
                });
            }
        }
    }
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});