/******************************************************************************************************
	Script Name - DS_Utility.js
	Author : daniel@finance4.cloud @Dsair92.
******************************************************************************************************/

/**
* @NApiVersion 2.0
* @NModuleScope Public
*/

define(['N/record', 'N/search', 'N/runtime', 'N/https', 'N/format', 'N/url', 'N/task'],
	function (record, search, runtime, https, format, url, task){
        let functions = {};
        
        functions.DateString = (date) => {
            let format_date = functions.FormatDate(date);
            return  format_date.getDate() + '/' + (format_date.getMonth() + 1) + '/' + (format_date.getFullYear());
        };
        
        functions.GetUsage = () => {
            var scriptObj = runtime.getCurrentScript();
            var remainingUsage = scriptObj.getRemainingUsage();
            return remainingUsage;
        };
        
        functions.isNullOrEmpty = (val) => {
            if (typeof (val) == 'undefined' || val == null || (typeof (val) == 'string' && val.length === 0)) {
                return true;
            }
            return false;
        };
        
        functions.FormatDate = (date) => {
            var parsedDate = format.parse({
                value: date,
                type: format.Type.DATE
            });
            return parsedDate;
        };
        functions.Create_Remitter = (name_rem,bank_id,cust_id,sub_id,bank_ref_code) => {
            var debug = {
                'Bank_Ref' : name_rem,
                'Payment_ID' : bank_id,
                'Cust_Payment' : cust_id,
                'Sub ID' : sub_id,
                'Ref_Bank' : bank_ref_code
            }
            log.debug('Value Remitter' , JSON.stringify(debug))
            var res = {}
            var customrecord_remitter_netsuite_cross_refSearchObj = search.create({
                type: "customrecord_remitter_netsuite_cross_ref",
                filters:
                [
                   ["custrecord_crossref_remitter_name","is",name_rem],
                   "AND", 
                    ["custrecord_ref_sub","anyof",sub_id],
                ],
                columns:
                ["scriptid"]
            });
            var Remitter_count_search = customrecord_remitter_netsuite_cross_refSearchObj.runPaged().count;
            log.debug({
                title: 'Search Count For ' + name_rem,
                details: Remitter_count_search
            })
            var Rec_Created = null
            if(Remitter_count_search == 0){
                var Remitter = record.create({
                    type: 'customrecord_remitter_netsuite_cross_ref',
                    isDynamic: false,
                });
                Remitter.setValue({fieldId: 'custrecord_crossref_remitter_name',value: name_rem,ignoreFieldChange: false});
                Remitter.setValue({fieldId: 'custrecord_ref_sub',value: sub_id,ignoreFieldChange: false});
                Remitter.setValue({fieldId: 'custrecord_crossref_created_from',value: bank_id,ignoreFieldChange: false})
                Remitter.setValue({fieldId: 'custrecord_ref_bank_ref_code',value: bank_ref_code ,ignoreFieldChange: false})
                if (functions.isNullOrEmpty(cust_id)){
                    cust_id = functions.find_cust(name_rem,sub_id);
                }
                if(!functions.isNullOrEmpty(cust_id)){
                    Remitter.setValue({fieldId: 'custrecord_crossref_netsuite_customer',value: cust_id,ignoreFieldChange: false});
                    Remitter.setValue('custrecord_ref_logic',5);
                    Remitter.setValue('custrecord_ref_remitter_found_ns',true);
                }
                log.debug({title: 'customer check',details: cust_id})
                Rec_Created = Remitter.save();
            }
            log.debug({title: 'Remitter Created',details: Rec_Created})
            res.rec_created = Rec_Created ;
            res.cust_id = cust_id  ;
            res.bank_ref_code = bank_ref_code
            return res
        };

        functions.find_cust = (cust_name, sub) => {
            let customer_id = null
            let cust_search = search.create({
                type: record.Type.CUSTOMER,
                filters: [
                    ["companyname", "is", cust_name],
                    "AND",
                    ["subsidiary", "anyof", sub],
                    "AND",
                    ["isinactive", "is", "F"]
                ],
                columns: ["internalid"]
            });
            let cust_search_count = cust_search.runPaged().count;
            log.debug({
                title: 'search_Result 1',
                details: cust_search_count
            });
            if (cust_search_count == 0) {
                cust_search = search.create({
                    type: record.Type.CUSTOMER,
                    filters: [
                        ["companyname", "contains", cust_name],
                        "AND",
                        ["subsidiary", "anyof", sub],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: ["internalid"]
                });
                cust_search_count = cust_search.runPaged().count;
                log.debug({
                    title: 'search_Result 2',
                    details: cust_search_count
                });
                if (cust_search_count == 0) {
                    let cust_name_array = cust_name.split(" ");
                    for (let i = 0; i < cust_name_array.length; i++) {
                        log.debug({
                            title: 'search element',
                            details: cust_name_array[i]
                        })
                        cust_search = search.create({
                            type: record.Type.CUSTOMER,
                            filters: [
                                ["companyname", "contains", cust_name_array[i]],
                                "AND",
                                ["subsidiary", "anyof", sub],
                                "AND",
                                ["isinactive", "is", "F"]
                            ],
                            columns: ["internalid"]
                        });
                        cust_search_count = cust_search.runPaged().count;
                        if (cust_search_count == 1) {
                            break;
                        }
                    }
                }
            }
            if (cust_search_count == 1) {
                cust_search.run().each(function (result) {
                    log.debug({
                        title: 'result data',
                        details: result
                    })
                    customer_id = result.id
                });
            }
            return customer_id
        }
        functions.Get_Cust_Sub = (Cust) =>{
            var Cust_Sub = search.lookupFields({type: search.Type.CUSTOMER, id: Cust, columns: ['subsidiary']})
            return Cust_Sub.subsidiary[0].value
        }

        functions.TP_Subsidiary = (sub) => {
            var subsidiarySearchObj = search.create({
                type: "subsidiary",
                filters:
                [
                   ["custrecord_sub_tp_name","is",sub]
                ],
                columns:
                [
                   "internalid"
                ]
             });
             subsidiarySearchObj.run().each(function(result){
                return result.id
             });
            var sub_id = null;
            switch (sub) {
                case "Hi Bob (AU) Pty Ltd":
                    sub_id = 10
                    break;
                case "Hi Bob (NL) BV":
                    sub_id = 9
                    break;
                case "Hi Bob GmbH":
                    sub_id = 15
                    break;
                case "Hi Bob ltd":
                    sub_id = 4
                    break;
                case "Hi Bob, UNIPESSOAL LDA":
                    sub_id = 17
                    break;
                case "Hi Bob (UK) Limited":
                    sub_id = 3
                    break;
                case "HI Bob Inc":
                    sub_id = 8
                    break;
                case "HI BOB (CANADA) INC":
                    sub_id = 8
                    break;
                default:
                    break;
            }
            return sub_id
        }
         
        functions.Reschedule = () => {
            var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
            scriptTask.scriptId = runtime.getCurrentScript().id;
            scriptTask.deploymentId = runtime.getCurrentScript().deploymentId;
            scriptTask.submit();
        };
        
        functions.addDays = (theDate, days) => {
            return new Date(theDate.getTime() + days*24*60*60*1000);
        };
        functions.get_bank_approver = (subsidiary, field, excludeUserId) => {
            var approverIds = [];
            if( functions.isNullOrEmpty(subsidiary) || functions.isNullOrEmpty(field)){
                return approverIds
            }
            var approverSearch = search.create({
                type: 'customrecord_vendor_bank_approver',
                filters: [
                    ['custrecord_vba_subsidiary', 'anyof', subsidiary]
                ],
                columns: [field]
            });
            var results = approverSearch.run().getRange({
                start: 0,
                end: 1 // Increase the range to get more results if needed
            });
            for (var i = 0; i < results.length; i++) {
                var approverIdString = results[i].getValue(field);
                var approverIdArray = approverIdString.split(',').map(function(id) {
                    return parseInt(id, 10);
                });
                approverIdArray.forEach(function(approverId) {
                    if (!excludeUserId || approverId !== parseInt(excludeUserId, 10)) {
                        approverIds.push(approverId);
                    }
                });
            }
    
            return approverIds;
        }

        return functions;
	}
);
