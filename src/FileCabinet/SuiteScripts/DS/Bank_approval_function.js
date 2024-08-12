/******************************************************************************************************
	Script Name - DS_Utility.js
	Author : daniel@finance4.cloud @Dsair92.
******************************************************************************************************/

/**
* @NApiVersion 2.1
* @NModuleScope Public
*/

define(['N/record', 'N/search', 'N/runtime','N/currentRecord'],
	function (record, search,runtime,currentRecord){
    let functions = {};
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
        log.debug('test',approverIds);
        return approverIds;
    }
    functions.isNullOrEmpty = (val) => {
        if (typeof (val) == 'undefined' || val == null || (typeof (val) == 'string' && val.length === 0)) {
            return true;
        }
        return false;
    };
    functions.change_field_display = (form,fieldIds,displayType) => {
        fieldIds.forEach(field_id => {
            var originalField = form.getField({ id: field_id });   
            if (originalField) {
                originalField.updateDisplayType({
                    displayType: displayType
                });
            }
        });
    }
    functions.hide_fields = (excludeList) => {
      var fullList = [
          "custrecord_vbd_il_branch",
          "custrecord_vbd_il_branch_name",
          "custrecord_vbd_il_bank_code",
          "custrecord_vbd_il_bank_name",
          "custrecord_vbd_il_branch_address",
          "custrecord_vbd_bic_code",
          "custrecord_vbd_transfer_method",
          "custrecord_vbd_transfer_method_type",
          "custrecord_vbd_bank_name",
          "custrecord_vbd_iban",
          "custrecord_vbd_sort_code",
          "custrecord_vbd_institution_number",
          "custrecord_vbd_transit_number",
          "custrecord_vbd_routing_number"
      ];
  
      return fullList.filter(function(fieldId) {
          return !excludeList.includes(fieldId);
      });
    }
    functions.get_field_to_hide = (flow) => {
        var fieldMap = {
            3: [
              "custrecord_vbd_il_branch",
              "custrecord_vbd_il_branch_name",
              "custrecord_vbd_il_bank_code",
              "custrecord_vbd_il_bank_name",
              "custrecord_vbd_il_branch_address"
              ],
            2: [
                "custrecord_vbd_il_branch",
                "custrecord_vbd_il_branch_name",
                "custrecord_vbd_il_bank_code",
                "custrecord_vbd_il_bank_name",
                "custrecord_vbd_il_branch_address"
            ],
            1: [
                "custrecord_vbd_bic_code",
                "custrecord_vbd_transfer_method",
                "custrecord_vbd_transfer_method_type",
                "custrecord_vbd_bank_name",
                "custrecord_vbd_iban",
                "custrecord_vbd_sort_code",
                "custrecord_vbd_bank_address_1",
                "custrecord_vbd_purpose_payment",
                "custrecord_vbd_bank_city",
                "custrecord_vbd_bank_postal_code",
                "custrecord_vbd_institution_number",
                "custrecord_vbd_transit_number",
                "custrecord_vbd_routing_number"
            ]
        }
        return fieldMap[flow] || [];

    }
    functions.get_mandatory_field = (flow) => {
      var fieldMap = {
        2: [
          "custrecord_vbd_transfer_method",
        ],
        1: [
          "custrecord_vbd_il_branch",
          "custrecord_vbd_account_number"
        ]
    }
    return fieldMap[flow] || [];

    }
    functions.get_country_code = (id) => {
        var country_array = {
            "59": {
              "Code": "DK",
              "name": "Denmark"
            },
            "20": {
              "Code": "BE",
              "name": "Belgium"
            },
            "57": {
              "Code": "DE",
              "name": "Germany"
            },
            "70": {
              "Code": "FI",
              "name": "Finland"
            },
            "77": {
              "Code": "GB",
              "name": "United Kingdom"
            },
            "102": {
              "Code": "IE",
              "name": "Ireland"
            },
            "103": {
              "Code": "IL",
              "name": "Israel"
            },
            "166": {
              "Code": "NL",
              "name": "Netherlands"
            },
            "184": {
              "Code": "PT",
              "name": "Portugal"
            },
            "196": {
              "Code": "SE",
              "name": "Sweden"
            },
            "14": {
              "Code": "AU",
              "name": "Australia"
            },
            "37": {
              "Code": "CA",
              "name": "Canada"
            },
            "42": {
              "Code": "CH",
              "name": "Switzerland"
            },
            "68": {
              "Code": "ES",
              "name": "Spain"
            },
            "75": {
              "Code": "FR",
              "name": "France"
            },
            "105": {
              "Code": "IN",
              "name": "India"
            },
            "167": {
              "Code": "NO",
              "name": "Norway"
            },
            "179": {
              "Code": "PL",
              "name": "Poland"
            },
            "222": {
              "Code": "TR",
              "name": "Türkiye"
            },
            "230": {
              "Code": "US",
              "name": "United States"
            }
        }
        return country_array[id].Code || null
          
    }
    functions.build_json_fi = (rec) => {
      let json_built = {}
      let address = {}
      let paymentDefaults = {}
      let payment_default_fields = [
        { 
          "name" : "purposeMessage",
          "id" : "custrecord_vbd_purpose_payment"

        }
      ]
      let fields_address = [
        { 
          "name" : "line1",
          "id" : "custrecord_vbd_bank_address_1"

        },
        { 
          "name" : "city",
          "id" : "custrecord_vbd_bank_city"

        },
        { 
          "name" : "postalCode",
          "id" : "custrecord_vbd_bank_postal_code"

        },
        { 
          "name" : "stateProvince",
          "id" : "custrecord_vbd_country"

        }
      ]
      let fields_to_check = [
        {
          "name": "bankName",
          "id": 'custrecord_vbd_bank_name'
        },
        {
          "name": "bic",
          "id": 'custrecord_vbd_bic_code'
        },
        {
          "name": "iban",
          "id": 'custrecord_vbd_iban'
        },
        {
          "name": "localBranchCode",
          "id": 'custrecord_vbd_sort_code'
        },
        {
          "name": "routingNumber",
          "id" : "custrecord_vbd_routing_number"
        },
        {
          "name": "accountNumber",
          "id" : "custrecord_vbd_account_number"
        }
      ]
      fields_address.forEach(obj => {
        let val = rec.getText(obj.id)
        address[obj.name] = val;    
      });
      fields_to_check.forEach(obj => {
        let val = rec.getValue(obj.id)
        if(!functions.isNullOrEmpty(val)){
          json_built[obj.name] = val;
        } 
      });
      payment_default_fields.forEach(obj => {
        let val = rec.getValue(obj.id)
        if(!functions.isNullOrEmpty(val)){
          paymentDefaults[obj.name] = val;
        } 
      });
      if(!functions.isNullOrEmpty(paymentDefaults)){
        json_built.paymentDefaults = paymentDefaults;
      }
      json_built.accountType = 'CHECKING';
      json_built.address = address
      return JSON.stringify(json_built)
    }

    return functions;
  }
);
