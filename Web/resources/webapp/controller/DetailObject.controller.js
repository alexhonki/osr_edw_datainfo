/*
 * Created by Stefanus
 * Base template for Organisation Explorer
 * 19.09.2018
 */
sap.ui.define([
	"osr/edw/data/info/controller/SuperController",
	"sap/ui/model/json/JSONModel",
	"osr/edw/data/info/asset/lib/Formatters",
	"sap/m/Text",
	"sap/ui/model/Sorter"
], function (SuperController, JSONModel, Formatters, Text, Sorter) {
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
			this.setModel(new JSONModel(), "metaDataInfoHolder");
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
			oController.oPayloadHolder = {};
			//set the icontab bar to select the first tab everytime.
			//setting the key in the view.
			oController.getView().byId("data-info-tabbar").setSelectedKey("current-tab-key");
			oController._setModels();
			oController._onLoadSources();
			oController._fetchCSRFToken();
			oController._clearFormPayload();
			//when it hit this route, disable busy indicator if there's any.
			oController.showBusyIndicator(false);

		},

		/**
		 * Helper function to clear the entire form payload
		 * to reset whatever is in there
		 * @return {[type]} []
		 */
		_clearFormPayload: function () {
			let oController = this;
			//clear the JSON model for payload
			oController.getModel("formPayloadValue").setData({}, false);
		},

		/**
		 * Responsible when adding a new record, and there is a source change.
		 * This will update the auto generated file name
		 * @param  {[type]} oEvent [as described]
		 * @return {[type]}        []
		 */
		onNewRecordSourceChange: function (oEvent) {
			let oController = this;
			//update the table name.
			oController.oPayloadHolder.SOURCE = oEvent.getSource().getSelectedKey();
			oController.getView().byId("source-select").setSelectedKey(oController.oPayloadHolder.SOURCE);
			oController.readMetadataBySource(oController.oPayloadHolder.SOURCE);
			oController.readTableNameBySource(oController.oPayloadHolder.SOURCE);
			oController.getView().byId("table-name-select").setSelectedKey("");
			oController.oPayloadHolder.SVALUE = "";
			oController._updateMetaFileName();
		},

		/**
		 * Helper to grab the CSRF token at the start of the application
		 * To enable any other request other than GET to flow through
		 * @return {[type]} []
		 */
		_fetchCSRFToken: function () {
			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("metadataHelper");
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

		/**
		 * Reload current window for a refresh with a timeout.
		 * @return {[type]} [description]
		 */
		_reloadWindow: function () {
			//reload within 1.5 secs at least.
			setTimeout(location.reload(), 3000);
		},

		/**
		 * Get all the different system sources when the page hit
		 * @return {[type]} []
		 */
		_onLoadSources: function () {
			let oController = this;
			//for api call search
			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("metadataHelper");

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
					} else if (error.status === 401) {
						oController.sendMessageToast("It seems you are logged out, we will refresh this page automatically in 2 seconds.");
						oController._reloadWindow(); //refresh page.

					} else if (error.responseText === "No Data") {
						return;
					} else {
						oController.sendMessageToast("Something went wrong, our apologies. Please close the browser and try again.");
					}

				}
			});
		},

		/**
		 * Helper to show the source drop down
		 * Either visible or not visible depending on the parameter
		 * @param  {[type]} bShow [description]
		 * @return {[type]}       [description]
		 */
		_bSetShowSourceDropdown: function (bShow) {
			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showSourceDropdown: bShow
			}, true);
		},

		/**
		 * Helper to show cancel new record button
		 * Either visible or not visible depending on the parameter
		 * @param  {[type]} bShow [boolean on whether to show or not]
		 * @return {[type]}       []
		 */
		_bSetShowCancelNewRecordBtn: function (bShow) {
			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showCancelNewBtn: bShow
			}, true);
		},

		/**
		 * Helper to show the add new record button
		 * Either visible or not visible depending on the parameter
		 * @param  {[type]} bShow [boolean on whether to show or not]
		 * @return {[type]}       []
		 */
		_bSetShowAddNewRecordBtn: function (bShow) {
			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showAddRecordNewBtn: bShow
			}, true);
		},

		/**
		 * Helper to show update record button
		 * Either visible or not visible depending on the parameter
		 * @param  {[type]} bShow [boolean on whether to show or not]
		 * @return {[type]}       []
		 */
		_bSetShowUpdateRecordBtn: function (bShow) {
			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showUpdateRecord: bShow
			}, true);
		},

		/**
		 * On initialisation of the app, set all the related model
		 * for the UI placeholder and the different control point
		 * @return {[type]} []
		 */
		_setModels: function () {
			let oController = this;
			//reset all JSON model that the view dependent on.
			oController._bSetShowSourceDropdown(true);
			oController._bShowMainTable(true);
			oController._bSetShowCancelNewRecordBtn(false);
			oController._bSetShowAddNewRecordBtn(false);
			oController._bSetShowUpdateRecordBtn(false);
			oController._bShowEntireSourceForm(true);
			oController._bUpdateMode(false);
			oController._bShowCreateMetadataBtn(false);
		},

		/**
		 * Helper to show the entire record form or not.
		 * @param  {[type]} bShow [boolean to show or not show]
		 * @return {[type]}       []
		 */
		_bShowEntireSourceForm: function (bShow) {
			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showEntireSourceForm: bShow
			}, true);
		},

		/**
		 * To bind different source depending on what is selected from
		 * the dropdown
		 * @param  {[type]} sSource [source from the selected dropdown]
		 * @return {[type]}         []
		 */
		readMetadataBySource: function (sSource) {
			let oController = this;

			//bind automatically from the model for all the valid address

			let oBindingInfo = {
				path: "metadataModel>/metadataRecordsParameters(IP_SOURCE='" + sSource + "')/Results",
				sorter: new Sorter("CREATED_AT", true)
			};
			oController.getView().byId("metadata-records-table").bindRows(oBindingInfo);

			// oController.getView().byId("metadata-records-table").bindRows("metadataModel>/metadataRecordsParameters(IP_SOURCE='" + sSource +
			// 	"')/Results");

		},

		/**
		 * Get the different table name depending on the source
		 * @param  {[type]} sSource [source from the selected dropdown]
		 * @return {[type]}         []
		 */
		readTableNameBySource: function (sSource) {
			let oController = this;
			//bind automatically from the model for all the valid address
			oController.getModel("metadataModel").read("/tableNameBySourceParameters(IP_SOURCE='" + sSource + "')/Results", {

				success: function (data) {

					oController.getModel("metaDataInfoHolder").setData(data.results, false);

				},
				error: function (oMessage) {
					console.log(oMessage);
				}
			});

		},

		/**
		 * Responsible for adding a new record depending on the selected source
		 * @param  {[type]} oEvent [description]
		 * @return {[type]}        [description]
		 */
		onAddNewRecord: function (oEvent) {

			let oController = this;
			oController._bShowMainTable(false);
			oController._bShowRecordForm(true);
			oController._bSetShowCancelNewRecordBtn(true);
			oController._bSetShowUpdateRecordBtn(false);
			oController._bSetShowAddNewRecordBtn(false);
			oController._bShowCreateMetadataBtn(true);
			oController._bShowEntireSourceForm(false);
			oController._bUpdateMode(false);
			oController._clearFormPayload();
			let sSelectedSource = oController.getView().byId("source-select").getSelectedKey();

			oController.oPayloadHolder.TIMESTAMP = "";
			oController.oPayloadHolder.SVALUE = "";
			oController.oPayloadHolder.SOURCE_FIELD_VALUE = "";
			oController.oPayloadHolder.SOURCE = sSelectedSource;
			oController.oPayloadHolder.SFILE_EXT = "";
			
			oController.getModel("formPayloadValue").setData({
				SOURCE: sSelectedSource,
				META_FILE_NAME: oController.oPayloadHolder.TIMESTAMP + "_" + oController.oPayloadHolder.SOURCE + "_",
				TIMESTAMP: moment(),
				HAS_LOADED_IN_EDW: false
			}, false);

		},

		/**
		 * Responsible for updating META_FILE_NAME when file received date
		 * picker is changed
		 * @param  {[type]} oEvent [control event triggered]
		 * @return {[type]}        []
		 */
		onFileReceiveDateChange: function (oEvent) {
			let oController = this;

			oController.oPayloadHolder.TIMESTAMP = oEvent.getSource().getValue();
			oController.oPayloadHolder.TIMESTAMP = oController.oPayloadHolder.TIMESTAMP.replace(/-/g, "");

			let sCurrentFileName = oController.oPayloadHolder.TIMESTAMP + "_" + oController.oPayloadHolder.SOURCE_FIELD_VALUE + "_" + oController.oPayloadHolder.SOURCE;

			if (typeof oController.oPayloadHolder.SVALUE !== "undefined") {
				sCurrentFileName += "_" + oController.oPayloadHolder.SVALUE;
			}

			if (typeof oController.oPayloadHolder.SFILE_EXT !== "undefined") {
				sCurrentFileName += oController.oPayloadHolder.SFILE_EXT;
			}

			oController.getModel("formPayloadValue").setData({
				META_FILE_NAME: sCurrentFileName
			}, true);
		},

		/**
		 * When the source being changed from the form,
		 * this is responsible for updating the auto generated file name
		 * @return {[type]} [description]
		 */
		_updateMetaFileName: function () {
			let oController = this;
			if (typeof oController.oPayloadHolder.SVALUE === "undefined" || oController.oPayloadHolder.SVALUE === "") {
				oController.oPayloadHolder.SVALUE = "";
			}
			oController.getModel("formPayloadValue").setData({
				META_FILE_NAME: oController.oPayloadHolder.TIMESTAMP + "_" + oController.oPayloadHolder.SOURCE + "_" + oController.oPayloadHolder
					.SVALUE.toUpperCase() + "_" + oController.oPayloadHolder.SFILE_EXT
			}, true);
		},

		/**
		 * Responsible for hooking up with the UI on the table
		 * input live event, it will automatically update generated file name
		 * @param  {[type]} oEvent [description]
		 * @return {[type]}        [description]
		 */
		onGenerationMetaFileName: function (oEvent) {
			let oController = this;
			oController.oPayloadHolder.SVALUE = oEvent.getSource().getValue();
			let sSourceInput = oEvent.getSource().data().sourceInput;
			let sCurrentFileName = oController.oPayloadHolder.TIMESTAMP + "_" + oController.oPayloadHolder.SOURCE_FIELD_VALUE + "_" + oController.oPayloadHolder.SOURCE + "_";
			if (sSourceInput === "table_name") {
				sCurrentFileName += oController.oPayloadHolder.SVALUE.toUpperCase();

				oController.getModel("formPayloadValue").setData({
					META_FILE_NAME: sCurrentFileName
				}, true);
			}

		},

		/**
		 * Responsible for source change and updating of the selected key
		 * @param  {[type]} oEvent [as described]
		 * @return {[type]}        [description]
		 */
		onSourceSelectChange: function (oEvent) {
			let oController = this;
			oController._bSetShowAddNewRecordBtn(true);
			let sSelectedKey = oEvent.getSource().getSelectedKey();
			//clear the JSON model for payload
			oController.getModel("formPayloadValue").setData({
				SOURCE: sSelectedKey,
				META_FILE_NAME: oController.oPayloadHolder.TIMESTAMP + "_" + oController.oPayloadHolder.SOURCE + "_"
			}, false);

			oController.readMetadataBySource(sSelectedKey);
			oController.readTableNameBySource(sSelectedKey);

		},

		/**
		 * Responsible for updating META_FILE_NAME when TABLE NAME
		 * dropdown selection is changed
		 * @param  {[type]} oEvent [control event triggered]
		 * @return {[type]}        []
		 */
		onTableNameSelectChange: function (oEvent) {

			let oController = this;
			oController.oPayloadHolder.SVALUE = oEvent.getSource().getSelectedKey();
			let sSourceInput = oEvent.getSource().data().sourceInput;
			let sCurrentFileName = oController.oPayloadHolder.TIMESTAMP + "_" + oController.oPayloadHolder.SOURCE_FIELD_VALUE + "_" + oController.oPayloadHolder.SOURCE + "_";

			sCurrentFileName += oController.oPayloadHolder.SVALUE.toUpperCase();

			if (typeof oController.oPayloadHolder.SFILE_EXT !== "undefined") {
				sCurrentFileName += oController.oPayloadHolder.SFILE_EXT;
			}

			oController.getModel("formPayloadValue").setData({
				META_FILE_NAME: sCurrentFileName
			}, true);

		},

		/**
		 * Responsible for updating META_FILE_NAME when TABLE NAME
		 * dropdown selection is changed
		 * @param  {[type]} oEvent [control event triggered]
		 * @return {[type]}        []
		 */
		onFileExtensionSelectChange: function (oEvent) {
			let oController = this;
			oController.oPayloadHolder.SFILE_EXT = oEvent.getSource().getSelectedKey();
			let sSourceInput = oEvent.getSource().data().sourceInput;
			let sCurrentFileName = oController.oPayloadHolder.TIMESTAMP + "_" + oController.oPayloadHolder.SOURCE_FIELD_VALUE + "_" + 
			oController.oPayloadHolder.SOURCE + "_" + oController.oPayloadHolder.SVALUE;

			sCurrentFileName += oController.oPayloadHolder.SFILE_EXT;

			oController.getModel("formPayloadValue").setData({
				META_FILE_NAME: sCurrentFileName
			}, true);

		},
		
		/**
		 * Responsible for updating META_FILE_NAME when 
		 * Source Field Value is changed
		 * @param  {[type]} oEvent [control event triggered]
		 * @return {[type]}        []
		 */
		onSourceFieldValueChange: function (oEvent) {
			
			let oController = this;
			oController.oPayloadHolder.SOURCE_FIELD_VALUE = oEvent.getSource().getValue().toUpperCase().trim();
			let sSourceInput = oEvent.getSource().data().sourceInput;
			let sCurrentFileName = oController.oPayloadHolder.TIMESTAMP + "_" + oController.oPayloadHolder.SOURCE_FIELD_VALUE + 
			"_" + oController.oPayloadHolder.SOURCE + "_" + oController.oPayloadHolder.SVALUE + oController.oPayloadHolder.SFILE_EXT;

			oController.getModel("formPayloadValue").setData({
				META_FILE_NAME: sCurrentFileName
			}, true);

		},

		/**
		 * When new source is selected, don't show the dropdown list
		 * @param  {[type]} oEvent [as described]
		 * @return {[type]}        [description]
		 */
		addNewSourceButton: function (oEvent) {
			const oController = this;

			oController._bSetShowSourceDropdown(false);
		},

		/**
		 * When edit button is triggered, read from the service that particular
		 * record and load it into the JSON model
		 * @param  {[type]} oEvent [as described]
		 * @return {[type]}        [description]
		 */
		onEditEntry: function (oEvent) {
			let oController = this;

			oController._bSetShowUpdateRecordBtn(true);
			oController._bSetShowCancelNewRecordBtn(true);
			oController._bSetShowAddNewRecordBtn(false);
			oController._bUpdateMode(true);
			oController._bShowEntireSourceForm(false);
			oController._bShowCreateMetadataBtn(false);

			let sMetadataId = oEvent.getSource().data().metadataId;
			let sSource = oEvent.getSource().data().source;

			oController.getModel("metadataModel").read("/metadataRecords(IP_SOURCE='" + sSource + "',METADATA_ID='" + sMetadataId + "')", {

				success: function (data) {

					//check boolean value for has_loaded_in_edw, and change accordingly.
					//transform received data
					let oTransformedResult = oController._transformMetadataRecord(data);
					//set the data for for the entire view information.
					oController.getModel("formPayloadValue").setData(oTransformedResult, false);
					oController._bShowMainTable(false);
					oController._bShowRecordForm(true);
				},
				error: function (oMessage) {
					console.log(oMessage);
				}
			});

		},

		/**
		 * Transform the payload that was received from the service
		 * so that it is inline with what is being binded into the UI
		 * @param  {[type]} oDataReceived [as described]
		 * @return {[type]}               [description]
		 */
		_transformMetadataRecord: function (oDataReceived) {

			let oTransformedResult = oDataReceived;
			let oController = this;

			if (oTransformedResult.HAS_LOADED_IN_EDW === "N") {
				oTransformedResult.HAS_LOADED_IN_EDW = false;
			} else if (oTransformedResult.HAS_LOADED_IN_EDW === "Y") {
				oTransformedResult.HAS_LOADED_IN_EDW = true;
			}

			if (oTransformedResult.CREATED_AT) {
				oTransformedResult.CREATED_AT = moment(oTransformedResult.CREATED_AT).format("YYYY-MM-DD");
			}

			if (oTransformedResult.TIMESTAMP) {
				oTransformedResult.TIMESTAMP = moment(oTransformedResult.TIMESTAMP).format("YYYY-MM-DD");
			}

			if (oTransformedResult.TO_DATE) {
				oTransformedResult.TO_DATE = moment(oTransformedResult.TO_DATE).format("YYYY-MM-DD");
			}

			if (oTransformedResult.FROM_DATE) {
				oTransformedResult.FROM_DATE = moment(oTransformedResult.FROM_DATE).format("YYYY-MM-DD");
			}

			if (oTransformedResult.FILE_RECEIVED_DATE) {
				oTransformedResult.FILE_RECEIVED_DATE = moment(oTransformedResult.FILE_RECEIVED_DATE).format("YYYY-MM-DD");
			}

			return oTransformedResult;
		},

		/**
		 * Helper method to show that this is on update mode
		 * @param  {[type]} bShow [boolean status depending parameter]
		 * @return {[type]}       []
		 */
		_bUpdateMode: function (bShow) {

			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				updateMode: bShow
			}, true);

		},

		/**
		 * Helper to show main table depending on the boolean status
		 * that is given
		 * @param  {[type]} bShow [boolean status depending parameter]
		 * @return {[type]}       []
		 */
		_bShowMainTable: function (bShow) {

			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showTable: bShow
			}, true);

		},

		/**
		 * Helper function to show the record form depending on the status
		 * that is given
		 * @param  {[type]} bShow [boolean status depending parameter]
		 * @return {[type]}       [description]
		 */
		_bShowRecordForm: function (bShow) {

			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showForm: bShow
			}, true);

		},

		/**
		 * Helper function to show the record form depending on the status
		 * that is given
		 * @param  {[type]} bShow [boolean status depending parameter]
		 * @return {[type]}       [description]
		 */
		_bShowCreateMetadataBtn: function (bShow) {

			let oController = this;
			//reset all JSON model that the view dependent on.
			oController.getModel("viewHolder").setData({
				showCreateMetadataBtn: bShow
			}, true);

		},

		/**
		 * To create a new source
		 * @param  {[type]} oEvent [as described]
		 * @return {[type]}        [description]
		 */
		onCreateNewSource: function (oEvent) {
			//grab the source from the input
			//transform all to capital letter
			//initiate the create api call
			//reload the sources from the server
			//unhide the dropdown of the sources
			let oController = this;

			//input form value and transform to uppercase and trim
			let sNewSource = oController.getView().byId("new-source-input").getValue().toUpperCase().trim();

			if (typeof sNewSource === "undefined" || sNewSource === "") {
				oController.sendMessageToast("Source can't be empty! Please input something.");
			} else {
				let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("metadataHelper");

				//check uniqueness of the file name to the back-end
				$.ajax(sApiUrl + "checkSourceUniqueness", {
					data: {
						SOURCE_NAME: sNewSource
					},
					type: "POST",
					success: function (data) {

						if (data.Results.length > 0) {
							oController.sendMessageToast("Source with this name already exist! Please double check.");
						} else {
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
									oController._bSetShowAddNewRecordBtn(true);
									oController._setDropdownSource(sNewSource);
									oController.getView().byId("new-source-input").setValue(""); //reset the value
									oController.sendMessageToast("New source created succesfully!");
									oController.readMetadataBySource(sNewSource);
								},
								error: function (error) {
									//check for http error and serve accordingly.
									if (error.status === 403) {
										oController.sendMessageToast("You do not have enough authorisation please contact your system admin.");
									} else if (error.status === 401) {
										oController.sendMessageToast("It seems you are logged out, we will refresh this page automatically in 2 seconds.");
										oController._reloadWindow(); //refresh page.

									} else if (error.responseText === "No Data") {
										return;
									} else {
										oController.sendMessageToast("Something went wrong, our apologies. Please close the browser and try again.");
									}

								}
							});
						}

					},
					error: function (error) {
						//check for http error and serve accordingly.
						if (error.status === 403) {
							oController.sendMessageToast("You do not have enough authorisation please contact your system admin.");
						} else if (error.status === 401) {
							oController.sendMessageToast("It seems you are logged out, we will refresh this page automatically in 2 seconds.");
							oController._reloadWindow(); //refresh page.
						} else if (error.responseText === "No Data") {
							return;
						} else {
							oController.sendMessageToast("Something went wrong, our apologies. Please close the browser and try again.");
						}

					}
				});
			}

		},

		/**
		 * Responsible for creating a new record and sending it to the back end service
		 * @param  {[type]} oEvent [as described]
		 * @return {[type]}        []
		 */
		onCreateMetadaRecord: function (oEvent) {
			let oController = this;

			let oPayload = oController._processPayload(oController.getModel("formPayloadValue").getData());

			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("metadataHelper");

			//check whether there's table name, file extension and file received date thats already selected.
			if (oController._bValidatePayload(oPayload)) {
				//check uniqueness of the record
				$.ajax(sApiUrl + "checkUniqueness", {
					data: {
						META_FILE_NAME: oPayload.META_FILE_NAME
					},
					type: "POST",
					success: function (data) {

						if (data.Results.length > 0) {
							oController.sendMessageToast("File with this name already exist! Please double check.");
						} else {
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
									oController._bShowMainTable(true);
									oController._bShowRecordForm(false);
									oController._bShowEntireSourceForm(true);
									oController._bSetShowSourceDropdown(true);
									oController._bSetShowAddNewRecordBtn(true);
									oController._bSetShowCancelNewRecordBtn(false);

									let sSelectedKey = oController.getView().byId("source-select").getSelectedKey();
									oController.readMetadataBySource(sSelectedKey);
								},
								error: function (error) {
									//check for http error and serve accordingly.
									if (error.status === 403) {
										oController.sendMessageToast("You do not have enough authorisation please contact your system admin.");
									} else if (error.status === 401) {
										oController.sendMessageToast("It seems you are logged out, we will refresh this page automatically in 2 seconds.");
										oController._reloadWindow(); //refresh page.
									} else if (error.responseText === "No Data") {
										return;
									} else {
										oController.sendMessageToast("Something went wrong, our apologies. Please close the browser and try again.");
									}

								}
							});
						}
					},
					error: function (error) {
						//check for http error and serve accordingly.
						if (error.status === 403) {
							oController.sendMessageToast("You do not have enough authorisation please contact your system admin.");
						} else if (error.status === 401) {
							location.reload(); //refresh page.
						} else if (error.responseText === "No Data") {
							return;
						} else {
							oController.sendMessageToast("Something went wrong, our apologies. Please close the browser and try again.");
						}

					}
				});
			} else {
				oController.sendMessageToast("Please fill in table name, extension file, received date and source field value at a minimum!");
			}

		},

		/**
		 * Return boolean status depending on the validity of
		 * of the test from the payload
		 * @param  {[type]} oPayload [oPayload of the form]
		 * @return {[type]}        [Boolean status depending on oPayload]
		 */
		_bValidatePayload: function (oPayload) {
			//minium of these 3 fields that need to be validated.
			//check table name
			//check file extension
			//check file received date
			let oController = this;
			let sTableNameSelect = oController.getView().byId("table-name-select").getSelectedKey();
			let sExtensionSelect = oController.getView().byId("extension-select").getSelectedKey();
			let sFileReceivedDate = oController.getView().byId("file_received_date").getValue();
			let sSourceFieldValue = oController.getView().byId("source-field-value").getValue();
			
			if (typeof sTableNameSelect === "undefined" || sTableNameSelect === "") {
				return false;
			}

			if (typeof sExtensionSelect === "undefined" || sExtensionSelect === "") {
				return false;
			}

			if (typeof sFileReceivedDate === "undefined" || sFileReceivedDate === "") {
				return false;
			}
			
			if (typeof sSourceFieldValue === "undefined" || sSourceFieldValue === "") {
				return false;
			}

			//if all cases passes through, return true at the end;
			return true;
		},

		/**
		 * Responsible for updating a particular record with the given payload.
		 * @param  {[type]} oEvent [description]
		 * @return {[type]}        [description]
		 */
		onUpdateRecord: function (oEvent) {
			let oController = this;

			let oPayload = oController._processPayload(oController.getModel("formPayloadValue").getData());

			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("metadataHelper");
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

					//on success do all the different visiblity on different control
					oController._bShowEntireSourceForm(true);
					oController._bSetShowSourceDropdown(true);
					oController._bShowMainTable(true);
					oController._bShowRecordForm(false);
					oController._bSetShowCancelNewRecordBtn(false);
					oController._bSetShowAddNewRecordBtn(true);

					let sSelectedKey = oController.getView().byId("source-select").getSelectedKey();
					oController.readMetadataBySource(sSelectedKey);
				},
				error: function (error) {
					//check for http error and serve accordingly.
					if (error.status === 403) {
						oController.sendMessageToast("You do not have enough authorisation please contact your system admin.");
					} else if (error.status === 401) {
						oController.sendMessageToast("It seems you are logged out, we will refresh this page automatically in 2 seconds.");
						oController._reloadWindow(); //refresh page.

					} else if (error.responseText === "No Data") {
						return;
					} else {
						oController.sendMessageToast("Something went wrong, our apologies. Please close the browser and try again.");
					}

				}
			});
		},

		/**
		 * Helper function to grab the correct date object
		 * before sending it back to service
		 * @param  {[type]} oPayload [object]
		 * @return {[type]}          [description]
		 */
		_processPayload: function (oPayload) {

			let oController = this;

			let oFinalPayload = oPayload;
			if (oController.getModel("formPayloadValue").getData().TIMESTAMP._d) {
				oFinalPayload.TIMESTAMP = oController.getModel("formPayloadValue").getData().TIMESTAMP._d;
			}

			return oFinalPayload;

		},

		/**
		 * Cancel the creation of a new source and reset the value
		 * if any that is already in the control
		 * @param  {[type]} oEvent [as described]
		 * @return {[type]}        []
		 */
		onCancelNewSource: function (oEvent) {
			let oController = this;
			oController.getView().byId("new-source-input").setValue(""); //reset the value
			oController._bSetShowSourceDropdown(true);
			if (oController.getView().byId("source-select").getSelectedKey() !== "") {
				oController._bSetShowAddNewRecordBtn(true);
			}

		},

		/**
		 * When cancelling record creation, invoke the different function
		 * so that it shows accordingly
		 * @param  {[type]} oEvent [as described]
		 * @return {[type]}        [description]
		 */
		onCancelNewRecord: function (oEvent) {
			let oController = this;
			oController._bShowMainTable(true);
			oController._bShowRecordForm(false);
			oController._bSetShowCancelNewRecordBtn(false);
			oController._bSetShowAddNewRecordBtn(true);
			oController._bShowEntireSourceForm(true);
			oController._bShowCreateMetadataBtn(false);
		},

		/**
		 * Helper function to set the main dropdown depending on the given key
		 * @param  {[type]} sKeySelected [as described]
		 * @return {[type]}              [description]
		 */
		_setDropdownSource: function (sKeySelected) {
			this.getView().byId("source-select").setSelectedKey(sKeySelected);
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