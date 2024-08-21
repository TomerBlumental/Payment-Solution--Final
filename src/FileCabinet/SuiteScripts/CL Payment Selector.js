/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function(currentRecord) {

    function fieldChanged(context) {
        var currRec = currentRecord.get();

        if (context.fieldId === 'custpage_subsidiary') {
            var subsidiaryId = currRec.getValue('custpage_subsidiary');
            var mappingJson = currRec.getValue('custpage_subsidiary_currency_map');
            var subsidiaryCurrenciesMap = JSON.parse(mappingJson);

            // Clear existing options in the currency field
            var currencyField = currRec.getField('custpage_currency');
            currencyField.removeSelectOption({ value: null });

            // Add relevant currencies for the selected subsidiary
            if (subsidiaryId && subsidiaryCurrenciesMap[subsidiaryId]) {
                subsidiaryCurrenciesMap[subsidiaryId].forEach(function(currencyId) {
                    currencyField.insertSelectOption({
                        value: currencyId,
                        text: 'Currency ' + currencyId  // Replace with actual currency name if needed
                    });
                });
            } else {
                // If no subsidiary is selected, clear currency field
                currencyField.insertSelectOption({ value: '', text: '' });
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});