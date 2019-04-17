/*
 * Created by Stefanus
 * Base template for Organisation Explorer
 * 19.09.2018
 */
sap.ui.define([
	"osr/edw/data/info/controller/SuperController",
	"sap/ui/model/json/JSONModel",
	"osr/edw/data/info/asset/lib/Formatters",
	"sap/m/Text"
], function (SuperController, JSONModel, Formatters, Text) {
	"use strict";

	let DetailObject = SuperController.extend("osr.edw.data.info.controller.DetailObject", {

		Formatters: Formatters,
		/**
		 * Run on initialize
		 * @return {[type]} [description]
		 */
		onInit: function () {

			//setting up of all models to serve if needed.
			//some are binded straight away
			this.setModel(new JSONModel(), "viewHolder");
			this.setModel(new JSONModel(), "metaData");
			this.setModel(new JSONModel(), "formPayloadValue"); //model to carry payload

			this.getRouter().getRoute("homepage").attachPatternMatched(this._onRouteMatched, this);

		},

		/**
		 * Everytime route is matched, will trigger below.
		 * @param  {[type]} oEvent [description]
		 * @return {[type]}        [description]
		 */
		_onRouteMatched: function (oEvent) {
			let oController = this;

			oController.sViewName = "objectdetail";

			//set the icontab bar to select the first tab everytime.
			//setting the key in the view.
			oController.getView().byId("scv-tabbar").setSelectedKey("current-tab-key");
			oController._setModels();
			oController._onLoadSources();
			oController._onLoadMetadata();
			oController._fetchCSRFToken();
			oController._clearFormPayload();
			//when it hit this route, disable busy indicator if there's any.
			oController.showBusyIndicator(false);

		},

		_clearFormPayload: function () {
			let oController = this;
			//clear the JSON model for payload
			oController.getModel("formPayloadValue").setData({}, false);
		},
		
		onNewRecordSourceChange: function(oEvent){
		 let temp = 1;	
		},

		_fetchCSRFToken: function () {
			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("searchHelper");
			$.ajax({

				type: "GET",

				url: sApiUrl + "getToken",

				headers: {
					"X-Csrf-Token": "Fetch"
				},

				success: function (res, status, xhr) {

					var sHeaderCsrfToken = "X-Csrf-Token";

					var sCsrfToken = xhr.getResponseHeader(sHeaderCsrfToken);
					$(document).ajaxSend(function (event, jqxhr, settings) {
						if (settings.type === "POST" || settings.type === "PUT" || settings.type === "DELETE") {

							jqxhr.setRequestHeader(sHeaderCsrfToken, sCsrfToken);
						}

					});
				}

			});

		},

		_onLoadSources: function () {
			let oController = this;
			//for api call search
			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("searchHelper");

			$.ajax(sApiUrl + "getSources", {
				data: '',
				type: "GET",
				beforeSend: function () {
					//loading effect start if needed
				},
				complete: function () {
					//loading effect end if needed
				},
				success: function (data) {

					let oSources = {};
					oSources.Sources = data;
					//set data from database
					oController.getModel("viewHolder").setData(oSources, true);
				},
				error: function (error) {
					//check for http error and serve accordingly.
					if (error.status === 403) {
						oController.sendMessageToast("You do not have enough authorisation please contact your system admin.");
					} else if (error.responseText === "No Data") {
						return;
					} else {
						oController.sendMessageToast("Something went wrong, our apologies. Please close the browser and try again.");
					}

				}
			});
		},

		_bSetShowSourceDropdown: function (bShow) {
			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showSourceDropdown: bShow
			}, true);
		},

		_setModels: function () {
			let oController = this;
			//reset all JSON model that the view dependent on.

			oController._bSetShowSourceDropdown(true);
			oController._bShowMainTable(true);
		},

		_onLoadMetadata: function () {
			let oController = this;
			//for api call search
			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("searchHelper");

			$.ajax(sApiUrl + "getMetadata", {
				data: '',
				type: "GET",
				beforeSend: function () {
					//loading effect start if needed
				},
				complete: function () {
					//loading effect end if needed
				},
				success: function (data) {

					//	let oSources = {};
					//	oSources.Sources = data;
					//set data from database
					oController.getModel("metaData").setData(data, false);
				},
				error: function (error) {
					//check for http error and serve accordingly.
					if (error.status === 403) {
						oController.sendMessageToast("You do not have enough authorisation please contact your system admin.");
					} else if (error.responseText === "No Data") {
						return;
					} else {
						oController.sendMessageToast("Something went wrong, our apologies. Please close the browser and try again.");
					}

				}
			});
		},

		onAddNewRecord: function (oEvent) {
			//hide the main table 
			//show the form 
			let oController = this;
			oController._bShowMainTable(false);
			oController._bShowForm(true);
		},

		onSourceSelectChange: function (oEvent) {
			let oController = this;
			let sSelectedKey = oEvent.getSource().getSelectedKey();
			//clear the JSON model for payload
			oController.getModel("formPayloadValue").setData({SOURCE:sSelectedKey}, false);
		},

		/**
		 * [description]
		 * @param  {[type]} oEvent [description]
		 * @return {[type]}        [description]
		 */
		addNewSourceButton: function (oEvent) {
			const oController = this;

			oController._bSetShowSourceDropdown(false);
		},

		// to edit the the particular entry for each line
		onEditEntry: function (oEvent) {
			let sMetadataId = oEvent.getSource().data().metadataId;

			//hide the table from the main page 
			//load the data into the form 

		},

		_bShowMainTable: function (bShow) {

			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showTable: bShow
			}, true);

		},

		_bShowForm: function (bShow) {

			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showForm: bShow
			}, true);

		},

		onCreateNewSource: function (oEvent) {
			//grab the source from the input
			//transform all to capital letter
			//initiate the create api call 
			//reload the sources from the server
			//unhide the dropdown of the sources 
			let oController = this;

			//input form value and transform to uppercase and trim
			let sNewSource = oController.getView().byId("new-source-input").getValue().toUpperCase().trim();
			oController.getView().byId("new-source-input").setValue(""); //reset the value

			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("searchHelper");
			$.ajax(sApiUrl + "getCurrentUser", {
				data: {
					sSource: sNewSource
				},
				type: "POST",
				beforeSend: function () {
					//loading effect start if needed
				},
				complete: function () {
					//loading effect end if needed
				},
				success: function (data) {
					oController._onLoadSources();
					oController._bSetShowSourceDropdown(true);
					oController._setDropdownSource(sNewSource);
				},
				error: function (error) {
					//check for http error and serve accordingly.
					if (error.status === 403) {
						oController.sendMessageToast("You do not have enough authorisation please contact your system admin.");
					} else if (error.responseText === "No Data") {
						return;
					} else {
						oController.sendMessageToast("Something went wrong, our apologies. Please close the browser and try again.");
					}

				}
			});

		},
		
		onCancelCreation: function(oEvent){
			let oController = this;
			oController.getView().byId("new-source-input").setValue(""); //reset the value
			oController._bSetShowSourceDropdown(true);
		},
		
		onCancelNewRecord: function(oEvent){
			let oController = this;
			oController._bShowMainTable(true);
			oController._bShowForm(false);
		},

		_setDropdownSource: function (sKeySelected) {
			this.getView().byId("abn-select").setSelectedKey(sKeySelected);
		},

		/**
		 * Force the back button to go to homepage, without
		 * taking into account the history of where it was from.
		 */
		onNavBack: function () {

			this.getRouter().navTo("appHome");

		}
	});

	return DetailObject;
});