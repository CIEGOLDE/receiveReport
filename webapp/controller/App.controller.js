sap.ui.define(["./BaseController",
	// "./designMode",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";
	return BaseController.extend("cie.receiveReport.controller.App", {
		onInit: function () {
			// this.getView().addStyleClass(designMode.getCompactCozyClass());
		}
	});
});