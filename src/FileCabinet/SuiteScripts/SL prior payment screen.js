/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect'], 
    function(serverWidget, search, redirect) {

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({
                    title: 'Subsidiary and Currency Selection'
                });

                var subsidiaryField = form.addField({
                    id: 'custpage_subsidiary',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Subsidiary'
                });

                var currencyField = form.addField({
                    id: 'custpage_currency',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Currency'
                });

                // Populate Subsidiary and Currency fields with options
                var subsidiarySearch = search.create({
                    type: search.Type.SUBSIDIARY,
                    columns: ['internalid', 'name']
                });

                subsidiarySearch.run().each(function(result) {
                    subsidiaryField.addSelectOption({
                        value: result.getValue({name: 'internalid'}),
                        text: result.getValue({name: 'name'})
                    });
                    return true;
                });

                var currencySearch = search.create({
                    type: search.Type.CURRENCY,
                    columns: ['internalid', 'name']
                });

                currencySearch.run().each(function(result) {
                    currencyField.addSelectOption({
                        value: result.getValue({name: 'internalid'}),
                        text: result.getValue({name: 'name'})
                    });
                    return true;
                });

                form.addSubmitButton({
                    label: 'Next'
                });

                context.response.writePage(form);
            } else {
                // Redirect to Payment Screen with selected parameters
                var subsidiary = context.request.parameters.custpage_subsidiary;
                var currency = context.request.parameters.custpage_currency;

                redirect.toSuitelet({
                    scriptId: 'customscript_payment_screen', 
                    deploymentId: null, 
                    parameters: {
                        subsidiary: subsidiary,
                        currency: currency
                    }
                });
            }
        }

        return {
            onRequest: onRequest
        };
    });
