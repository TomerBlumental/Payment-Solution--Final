/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/query', 'N/record', 'N/runtime', 'N/search','./DS/DS_utility'],
    (query, record, runtime, search,ds) => {
        const functions = {}
        const conditionalBlock = (condition) => {
            if (!condition)
                  throw 'Creating more then one Entity Bank Details per vendor is prohibited';
        };
        //functions.beforeLoad = (Context) => {}
        functions.beforeSubmit = ({newRecord,type}) => {
            const lock_rec = newRecord.getValue('custrecord_fi_lock_record')
            if(!lock_rec){
                const vendor = newRecord.getValue('custrecord_fispan_vbd_vendor');
                const vendorEBD = query.runSuiteQL({
                    query: `
                        SELECT id, name
                        FROM customrecord_fispan_vendor_bank_details
                        WHERE custrecord_fispan_vbd_vendor = ${vendor}
                    `,
                }).asMappedResults();
                if (type === 'create') {
                    log.debug('create', vendorEBD.length === 0);
                    conditionalBlock(vendorEBD.length === 0);
                } else if (type !== 'delete') {
                    log.debug('update', vendorEBD.length === 1);
                    conditionalBlock(vendorEBD.length === 1);
                }
            }else{
                throw 'Changing the Record without using the Bank approval flow is prohibited';

            }
            
        }
        functions.afterSubmit = ({newRecord,type}) => {
            if (type !== 'delete'){
                record.submitFields({
                    type: newRecord.type,
                    id: newRecord.id,
                    values: {
                        custrecord_fi_lock_record : true
                    },
                    options: {
                        enablesourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.debug({
                    title: 'Create',
                    details: type
                })
                if(type == 'create'){
                    const vendor = newRecord.getValue('custrecord_fispan_vbd_vendor');
                    record.submitFields({
                        type: 'vendor',
                        id: vendor,
                        values: {
                            custentity_hb_ebd_record : newRecord.id
                        },
                        options: {
                            enablesourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                }
            }
           
        }
        return functions

    });
