/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/message', 'N/search', 'N/file', 'N/record','N/url','./DS/DS_utility'], (
      message,
      search,
      file,
      record,
      url,
      ds
) => {
      const EntryPoints = {};
      EntryPoints.beforeLoad = ({ form, newRecord, type }) => {
            try {
                  let bank_rec_status = newRecord.getValue({
                        fieldId: 'custentity_vbd_rec_status',
                  });
                  if(!ds.isNullOrEmpty(bank_rec_status)){
                        if(bank_rec_status == 4){
                              form.addPageInitMessage({
                                    type: message.Type.CONFIRMATION,
                                    message: 'Vendor Bank Details Are Approved',
                                    duration: 120000,
                              });
                        }else{
                              let bank_rec = newRecord.getValue('custentity_vbd_record');
                              form.addPageInitMessage({
                                    type: message.Type.WARNING,
                                    message: `Vendor Bank Details Are Not Approved - <a href="/app/common/custom/custrecordentry.nl?id=${bank_rec}&rectype=2462&whence=" target=”_blank”><b>View</b></a>`,
                                    duration: 120000,
                              });
                        }
                  }
            } catch (e) {
                  log.error('Error Occurred', e);
            }
      };
      /*
      EntryPoints.afterSubmit = ({ newRecord, oldRecord }) => {
            try {
                  log.debug({
                        title: 'newRecord',
                        details: newRecord
                  })
                  log.debug({
                        title: 'oldRecord',
                        details: oldRecord
                  })
                  let bank_rec = newRecord.getValue('custentity_vbd_record');
                  let old_bank_rec = oldRecord.getValue('custentity_vbd_record');
                  log.debug({
                        title: 'bank_rec',
                        details: bank_rec
                  })
                  log.debug({
                        title: 'old_bank_rec',
                        details: old_bank_rec
                  })
                  if (old_bank_rec != bank_rec && !ds.isNullOrEmpty(bank_rec)){
                        var customRecordUrl = url.resolveRecord({
                              recordType: 'customrecord_vendor_bank_detail',
                              recordId: bank_rec
                        });
                        window.location.href = customRecordUrl;
                        log.debug({
                              title: 'url_flow',
                              details: customRecordUrl
                        })
                  }
            } catch (e) {
                  log.error('Error Occurred', e);
            }
      };*/

      return EntryPoints;
});
