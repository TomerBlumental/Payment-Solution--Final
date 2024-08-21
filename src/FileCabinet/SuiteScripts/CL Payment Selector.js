/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search'], function(currentRecord, search) {

    function fieldChanged(context) {
        var currRec = currentRecord.get();

        if (context.fieldId === 'custpage_subsidiary') {
            var subsidiaryId = currRec.getValue('custpage_subsidiary');
            var mappingJson = currRec.getValue('custpage_subsidiary_currency_map');
            var subsidiaryCurrenciesMap = JSON.parse(mappingJson);

            // Clear existing options in the currency field
            var currencyField = currRec.getField('custpage_currency');
            currencyField.removeSelectOption({ value: null });

            // Add relevant currencies for the selected subsidiary using actual names
            if (subsidiaryId && subsidiaryCurrenciesMap[subsidiaryId]) {
                subsidiaryCurrenciesMap[subsidiaryId].forEach(function(currencyId) {
                    // Lookup currency name using search.lookupFields
                    var currencyName = search.lookupFields({
                        type: 'currency',
                        id: currencyId,
                        columns: ['name']
                    }).name;

                    // Insert the currency option only if the name is retrieved
                    if (currencyName) {
                        currencyField.insertSelectOption({
                            value: currencyId,
                            text: currencyName
                        });
                    }
                });
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});