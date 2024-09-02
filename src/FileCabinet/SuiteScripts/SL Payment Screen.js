/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/url', 'N/redirect'], 
    function(serverWidget, search, url, redirect) {

        function quoteAttr(s) {
            return ("" + s).replace(/&/g, "&amp;").replace(/'/g, "&apos;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        function toBooleanString(boolean) {
            return boolean ? "true" : "false";
        }

        function createReactApp(form, isConnected, hasConnectionError, processIsRunning) {
            var host = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "";

            var styleTag = '<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />';
            var styleField = form.addField({
                id: "custpage_appstylefield",
                type: serverWidget.FieldType.INLINEHTML,
                label: "App Style"
            });
            styleField.defaultValue = styleTag;

            var appTag = "<div id=\"netsuite_ssp\" data-host=\"".concat(host, "\" data-is-connected=\"").concat(toBooleanString(isConnected), "\" data-is-connection-error=\"").concat(toBooleanString(hasConnectionError), "\" data-is-process-running=\"").concat(toBooleanString(processIsRunning), "\"></div>");
            var appField = form.addField({
                id: "custpage_appcontainerfield",
                type: serverWidget.FieldType.INLINEHTML,
                label: "App Container"
            });
            appField.defaultValue = appTag;
            appField.updateLayoutType({
                layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
            });
        }

        function initApp(context, form, _ref) {
            var accessTitle = _ref.accessTitle,
                loadAdditionalData = _ref.loadAdditionalData || function () { return true; },
                hasAccess = _ref.hasAccess || function () { return false; },
                isProcessRunning = _ref.isProcessRunning || function () { return false; },
                addAdditionalFormFields = _ref.addAdditionalFormFields || function () { return false; };

            createReactApp(form, true, false, isProcessRunning());

            if (!loadAdditionalData(form, function (e) {
                return showConnectionError(context, form, e);
            })) {
                return;
            }

            if (!hasAccess()) {
                form = displayNotAvailableErrorScreen(form, accessTitle);
                context.response.writePage(form);
                return;
            }

            // Ensure "Next" button is added correctly
            addAdditionalFormFields(form);
        }

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var subsidiary = context.request.parameters.subsidiary;
                var currency = context.request.parameters.currency;

                var form = serverWidget.createForm({
                    title: 'Payment Screen'
                });

                form.clientScriptModulePath = './cs_summary_screen.js';

                initApp(context, form, {
                    accessTitle: 'Bill Payments',
                    loadAdditionalData: function(form, showConnectionError) {
                        try {
                            return true;
                        } catch (e) {
                            showConnectionError(e);
                            return false;
                        }
                    },
                    hasAccess: function() {
                        return true;
                    },
                    isProcessRunning: function() {
                        return false;
                    },
                    addAdditionalFormFields: function(form) {
                        // Add the "Next" button explicitly here
                        form.addButton({
                            id: 'custpage_next',
                            label: 'Next',
                            functionName: 'onNextClick'
                        });
                    }
                });

                var sublist = form.addSublist({
                    id: 'custpage_payment_sublist',
                    type: serverWidget.SublistType.EDITOR,
                    label: 'Payment Selection'
                });

                sublist.addField({
                    id: 'custpage_selectfield',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Select'
                });

                sublist.addField({
                    id: 'custpage_datefield',
                    type: serverWidget.FieldType.DATE,
                    label: 'Date'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'custpage_namefield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Name'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'custpage_documentnumberfield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Document Number'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'custpage_currencyfield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Currency'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'custpage_amountfield',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Amount (Foreign Currency)'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                sublist.addField({
                    id: 'custpage_paymentamountfield',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Payment Amount'
                });

                sublist.addField({
                    id: 'custpage_amountremainingfield',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Amount Remaining (Foreign Currency)'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });

                var transactionSearchObj = search.load({
                    id: 'customsearch_payment_screen_result'
                });

                transactionSearchObj.filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: subsidiary
                }));

                transactionSearchObj.filters.push(search.createFilter({
                    name: 'currency',
                    operator: search.Operator.IS,
                    values: currency
                }));

                var results = transactionSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });

                for (var i = 0; i < results.length; i++) {
                    var amount = parseFloat(results[i].getValue('fxamount'));
                    var amountRemaining = amount;

                    sublist.setSublistValue({
                        id: 'custpage_datefield',
                        line: i,
                        value: results[i].getValue('trandate')
                    });
                    sublist.setSublistValue({
                        id: 'custpage_namefield',
                        line: i,
                        value: results[i].getText('entity')
                    });
                    sublist.setSublistValue({
                        id: 'custpage_documentnumberfield',
                        line: i,
                        value: results[i].getValue('tranid')
                    });
                    sublist.setSublistValue({
                        id: 'custpage_currencyfield',
                        line: i,
                        value: results[i].getText('currency')
                    });
                    sublist.setSublistValue({
                        id: 'custpage_amountfield',
                        line: i,
                        value: amount
                    });
                    sublist.setSublistValue({
                        id: 'custpage_paymentamountfield',
                        line: i,
                        value: 0
                    });
                    sublist.setSublistValue({
                        id: 'custpage_amountremainingfield',
                        line: i,
                        value: amountRemaining
                    });
                }

                context.response.writePage(form);
            } else {
                // Handle the POST request logic if needed
            }
        }

        return {
            onRequest: onRequest
        };
    });