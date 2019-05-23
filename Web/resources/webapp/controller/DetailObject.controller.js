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
			//oController._onLoadMetadata();
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

		onNewRecordSourceChange: function (oEvent) {

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

		readMetadataBySource: function (sSource) {
			let oController = this;
			
			//bind automatically from the model for all the valid address
			oController.getView().byId("metadata-records-table").bindRows("metadataModel>/metadataRecordsParameters(IP_SOURCE='" + sSource +
				"')/Results");

		},

		onAddNewRecord: function (oEvent) {

			let oController = this;
			oController._bShowMainTable(false);
			oController._bShowForm(true);
			oController._clearFormPayload();
			let sSelectedSource = oController.getView().byId("source-select").getSelectedKey();

			oController.getModel("viewHolder").setData({
				generatedFileName: moment().format("YYYYMMDD") + "_" + sSelectedSource
			}, true);

			oController.getModel("formPayloadValue").setData({
				SOURCE: sSelectedSource,
				META_FILE_NAME: moment().format("YYYYMMDD") + "_" + sSelectedSource + "_",
				TIMESTAMP: moment(), 
				HAS_LOADED_IN_EDW: false
			}, false);

		},

		onGenerationMetaFileName: function (oEvent) {
			let oController = this;
			let sValue = oEvent.getSource().getValue();
			let sSourceInput = oEvent.getSource().data().sourceInput;
			let sCurrentFileName = moment().format("YYYYMMDD") + "_" + oController.getView().byId("source-select").getSelectedKey() + "_";
			if (sSourceInput === "table_name") {
				sCurrentFileName += sValue.toUpperCase();

				oController.getModel("formPayloadValue").setData({
					META_FILE_NAME: sCurrentFileName
				}, true);
			}

		},

		onSourceSelectChange: function (oEvent) {
			let oController = this;
			let sSelectedKey = oEvent.getSource().getSelectedKey();
			//clear the JSON model for payload
			oController.getModel("formPayloadValue").setData({
				SOURCE: sSelectedKey
			}, false);

			oController.readMetadataBySource(sSelectedKey);
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
			let oController = this;
			let sMetadataId = oEvent.getSource().data().metadataId;
			let sSource = oEvent.getSource().data().source;

			oController.getModel("metadataModel").read("/metadataRecords(IP_SOURCE='" + sSource + "',METADATA_ID='" + sMetadataId + "')", {

				success: function (data) {
					
					//check boolean value for has_loaded_in_edw, and change accordingly. 
					if(data.HAS_LOADED_IN_EDW === "N"){
						data.HAS_LOADED_IN_EDW = false;
					}else if(data.HAS_LOADED_IN_EDW === "Y"){
						data.HAS_LOADED_IN_EDW = true;
					}
					//set the data for for the entire view information.
					oController.getModel("formPayloadValue").setData(data, false);
					oController._bShowMainTable(false);
					oController._bShowForm(true);
				},
				error: function (oMessage) {
					console.log(oMessage);
				}
			});

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
			$.ajax(sApiUrl + "createNewSource", {
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

		onCreatePressed: function (oEvent) {
			let oController = this;
	
			let oPayload = oController._processPayload(oController.getModel("formPayloadValue").getData());

			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("searchHelper");
			$.ajax(sApiUrl + "createNewRecord", {
				data: oPayload,
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
					oController._bShowMainTable(true);
					oController._bShowForm(false);
					let sSelectedKey = oEvent.getSource().getSelectedKey();
					oController.readMetadataBySource(sSelectedKey);
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
		
		onUpdateRecord: function(oEvent){
			let oController = this;
	
			let oPayload = oController._processPayload(oController.getModel("formPayloadValue").getData());

			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("searchHelper");
			$.ajax(sApiUrl + "updateMetadataRecord", {
				data: oPayload,
				type: "PUT",
				beforeSend: function () {
					//loading effect start if needed
				},
				complete: function () {
					//loading effect end if needed
				},
				success: function (data) {
					oController._onLoadSources();
					oController._bSetShowSourceDropdown(true);
					oController._bShowMainTable(true);
					oController._bShowForm(false);
					let sSelectedKey = oEvent.getSource().getSelectedKey();
					oController.readMetadataBySource(sSelectedKey);
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
		
		_processPayload: function(oPayload){
			
			let oController = this; 
			 
			oController.getModel("formPayloadValue").getData().TIMESTAMP._d
			
			let oFinalPayload = oPayload;
			oFinalPayload.TIMESTAMP = oController.getModel("formPayloadValue").getData().TIMESTAMP._d;
			return oFinalPayload;
			
		}, 

		onCancelCreation: function (oEvent) {
			let oController = this;
			oController.getView().byId("new-source-input").setValue(""); //reset the value
			oController._bSetShowSourceDropdown(true);
		},

		onCancelNewRecord: function (oEvent) {
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