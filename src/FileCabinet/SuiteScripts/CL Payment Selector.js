/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search'], function(search) {

    function fieldChanged(context) {
        var currRec = context.currentRecord;

        if (context.fieldId === 'custpage_subsidiary') {
            var subsidiaryId = currRec.getValue({ fieldId: 'custpage_subsidiary' });
            var mappingJson = currRec.getValue({ fieldId: 'custpage_subsidiary_currency_map' });
            var subsidiaryCurrenciesMap = JSON.parse(mappingJson);

            // Get the Currency field
            var currencyField = currRec.getField({ fieldId: 'custpage_currency' });

            // Clear existing options in the Currency field
            while (currencyField.getSelectOptions().length > 0) {
                var options = currencyField.getSelectOptions();
                options.forEach(function(option) {
                    currencyField.removeSelectOption({ value: option.value });
                });
            }

            // Disable the Currency field if no Subsidiary is selected
            if (!subsidiaryId) {
                currencyField.isDisabled = true;
                return;
            }

            // Populate the Currency field with options based on the selected Subsidiary
            if (subsidiaryCurrenciesMap[subsidiaryId]) {
                subsidiaryCurrenciesMap[subsidiaryId].forEach(function(currencyId) {
                    var currencyName = search.lookupFields({
                        type: 'currency',
                        id: currencyId,
                        columns: ['name']
                    }).name;

                    if (currencyName) {
                        currencyField.insertSelectOption({
                            value: currencyId,
                            text: currencyName
                        });
                    }
                });

                // Enable the Currency field
                currencyField.isDisabled = false;
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});