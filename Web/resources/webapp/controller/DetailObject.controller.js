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
], function(SuperController, JSONModel, Formatters, Text) {
  "use strict";

  let DetailObject = SuperController.extend("osr.edw.data.info.controller.DetailObject", {

    Formatters: Formatters,
    /**
     * Run on initialize
     * @return {[type]} [description]
     */
    onInit: function() {

      //setting up of all models to serve if needed.
      //some are binded straight away
      this.setModel(new JSONModel(), "viewModel");
      this.setModel(new JSONModel(), "orgModel");
      this.setModel(new JSONModel(), "timelineModel");
      this.setModel(new JSONModel(), "abrModel");
      this.setModel(new JSONModel(), "acnModel");

      this.getRouter().getRoute("detailobject").attachPatternMatched(this._onRouteMatched, this);

    },

    /**
     * Everytime route is matched, will trigger below.
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    _onRouteMatched: function(oEvent) {
      let oController = this;

      oController.sViewName = "objectdetail";

      //set the icontab bar to select the first tab everytime.
      //setting the key in the view.
      oController.getView().byId("scv-tabbar").setSelectedKey("current-tab-key");

      //when it hit this route, disable busy indicator if there's any.
      oController.showBusyIndicator(false);

    },

    _resetModels: function(){
    	 let oController = this;
    	  //reset all JSON model that the view dependent on.
	      oController.getModel("orgModel").setData({}, false);
	      oController.getModel("abrModel").setData({}, false);
	      oController.getModel("acnModel").setData({}, false);
		  oController.getView().byId("acn-select").setSelectedKey("");
	      oController.getView().byId("abn-select").setSelectedKey("");
		  oController.getModel("viewModel").setProperty("/TELEPHONE", "");
		  oController.getModel("viewModel").setProperty("/MOBILE", "");
		  oController.getModel("viewModel").setProperty("/STD_EMAIL", "");
    },

    /**
     * Setter for visibility toggle of the link.
     * It shows up depending on the visibility flag.
     * @param  {[Object]} oEvent [as described]
     * @return {[type]}        [description]
     */
    onViewLinkPressed: function(oEvent) {
      let oController = this;
      let sWhichLink = oEvent.getSource().data().sWhichLink;

      //depending on the link, we will show different link and text.
      if (sWhichLink === "showTimeline") {
        oController.getModel("viewModel").setProperty("/SHOW_HISTORY_TABLE", false);
        oController.getModel("viewModel").setProperty("/SHOW_HISTORY_TIMELINE", true);
      } else if (sWhichLink === "showTable") {
        oController.getModel("viewModel").setProperty("/SHOW_HISTORY_TABLE", true);
        oController.getModel("viewModel").setProperty("/SHOW_HISTORY_TIMELINE", false);
      }

    },

    /**
     * Helper to read identificationOrgParameters end point.
     * @param  {[String]} sScvId [scvId of the entity.]
     * @return {[type]}        [description]
     */
    _readIdentificationData: function(sScvId) {

      let oController = this;
      oController.getView().byId("identification-table").bindRows("scvExplorerModel>/identificationOrgParameters(IP_SCV_ID='" + sScvId +
        "',IP_YEAR='9999')/Results");

      oController.getModel("scvExplorerModel").read("/identificationOrgParameters" + "(IP_SCV_ID='" + sScvId +
        "',IP_YEAR='9999')/Results", {
          urlParameters: {
            "$orderby": "S_VALID_TO desc"
          },
          success: function(data) {

            let oAjaxResult = data.results;

            if (oAjaxResult.length > 0) {
              let oResult = {};
              oResult.ACN = [];
              oResult.ABN = [];

              for (let iCounter = 0; iCounter < oAjaxResult.length; iCounter++) {

                if (oAjaxResult[iCounter].hasOwnProperty("ACN") && oAjaxResult[iCounter]["ACN"]) {
                  if (oResult.ACN.indexOf(oAjaxResult[iCounter]["ACN"]) < 0) {
                    oResult.ACN.push(oAjaxResult[iCounter]["ACN"]);
                  }

                }

                if (oAjaxResult[iCounter].hasOwnProperty("ABN") && oAjaxResult[iCounter]["ABN"]) {
                  if (oResult.ABN.indexOf(oAjaxResult[iCounter]["ABN"]) < 0) {
                    oResult.ABN.push(oAjaxResult[iCounter]["ABN"]);
                  }

                }

              }

              //transform the result and assign it to the model.
              oController.getModel("orgModel").setData(oResult, true);
            } else {
              //set it as is and its blank.
            }

          },
          error: function(oMessage) {
            console.log(oMessage);
          }
        });

    },

    /**
     * Helper to read addressParameters end point and just grab the top one.
     * assumption is there will only be one valid PO Box address.
     * @param  {[String]} sScvId [scvId of the entity.]
     * @return {[type]}        [description]
     */
    _readAkaNameData: function(sScvId) {
      let oController = this;
      oController.getView().byId("aka-names-table").bindRows("scvExplorerModel>/akaNamesParameters(IP_SCV_ID='" + sScvId +
        "')/Results");
    },

    /**
     * Read the address data of a particular SCVID
     * @param  {[String]} sScvId [the SCV ID of a particular object.]
     * @return {[type]}        [description]
     */
    _readAddressesData: function(sScvId) {

      let oController = this;
      oController.getView().byId("history-address-table").bindRows("scvExplorerModel>/addressParameters(IP_SCV_ID='" + sScvId +
        "')/Results");

      //read data for the the timeline via JSON model for easy manipulation.
      oController.getModel("scvExplorerModel").read("/addressParameters" + "(IP_SCV_ID='" + sScvId +
        "')/Results", {
          urlParameters: {
            "$orderby": "S_VALID_TO desc"
          },
          success: function(data) {

            // if there are more than 0 addresses then set the data.
            if (data.results.length > 0) {
              //bind the result to JSON model, for enhancement flexibility
              //allow easy filter for non case sensitive search.
              oController.getModel("timelineModel").setData(data.results, false);
            } else {
              //set blank when there's nothing
              oController.getModel("timelineModel").setData({}, false);
            }

          },
          error: function(oMessage) {
            console.log(oMessage);
          }
        });

    },

    /**
     * Helper to read contact data of a particular entity base on their SCVID
     * @param  {[type]} sScvId [String for the SCV ID that being passed in the URL]
     * @return {[type]}        [description]
     */
    _readContactData: function(sScvId) {

      let oController = this;
      //bind the contact tab for all of the contacts.
      oController.getView().byId("contact-history-table").bindRows("scvExplorerModel>/contactParameters(IP_SCV_ID='" + sScvId +
        "')/Results");

    },

    /**
     * Everytime route is matched, will trigger below.
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    _readCurrentOrganisationData: function(sScvId) {
      let oController = this;
      oController.getModel("scvExplorerModel").read("/organisationParameters(IP_SCV_ID='" + sScvId + "')/Results", {
        //both url to filter and order the result set.
        urlParameters: {
          "$orderby": "SOURCE desc, VALID_TO desc",
          "$filter": "substringof('9999',S_VALID_TO)"
        },
        success: function(data) {

          // grab the very top one for the current person.
          if (data.results.length > 0) {
            //set the data for for the entire view information.
            oController.getModel("viewModel").setData(data.results[0], true);

          }

        },
        error: function(oMessage) {
          console.log(oMessage);
        }
      });

      //bind automatically from the model for all the valid address
      oController.getView().byId("current-address-table").bindRows("scvExplorerModel>/addressParameters(IP_SCV_ID='" + sScvId +
        "',IP_YEAR='9999')/Results");

      //for api call search
			let sApiUrl = this.getOwnerComponent().getMetadata().getConfig("unstructuredSearch");
			let oPayload = {};
			oPayload.scvId = sScvId;
			oPayload.year = '9999';
			$.ajax(sApiUrl+"getContact", {
				data: oPayload,
				success: function(data) {

					oController.getModel("viewModel").setData(data.Results, true);


				},
				error: function(error) {
					//check for http error and serve accordingly.
					if (error.status === 403) {
						oController.sendMessageToast("You do not have enough authorisation please contact your system admin.");
					} else {
						oController.sendMessageToast("Something went wrong, our apologies. Please close the browser and try again.");
					}

				}
			});

    },

    onAsicHistoryPressed: function(oEvent) {
      let oAsicDialog = this.initializeDialog("AsicHistoryDialog", "osr.scv.org.explorer.view.dialog.",
        "osr.edw.data.info.controller.dialog.AsicHistoryDialog");

      oAsicDialog.open();
    },

    /**
     * On clicking in Identification tab and triggering the onlink pressed
     * responsible for reading for the table, binding and set the key selection
     * for the asic and abr table
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    onIdentificationNumberPressed: function(oEvent) {
      let oController = this;
      let oCustomData = {};
      oCustomData.abn = oEvent.getSource().data().abn;
      oCustomData.acn = oEvent.getSource().data().acn;
      oCustomData.scvId = oController.oPageParam.scvId;

      this.getView().byId("acn-select").setSelectedKey(oCustomData.acn);
      this.getView().byId("abn-select").setSelectedKey(oCustomData.abn);

      //set selected tab bar to registration and move it away from
      //identification tab
      this.getView().byId("scv-tabbar").setSelectedKey("registration-tab");

      //read the drop down selection for both ABR and ASIC
      oController._readAbrTable(oCustomData.abn);
      oController._readAsicTable(oCustomData.acn);


    },

    /**
     * Responsible for ABN / ABR drop down selection in Registration tab
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    onAbnSelectChange: function(oEvent) {
      let sSelectedAbn = oEvent.getSource().getSelectedKey();
      this._readAbrTable(sSelectedAbn);
    },

    /**
     * Responsbile for ASIC / ACN drop down selection in Registration tab
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    onAcnSelectChange: function(oEvent) {
      let sSelectedAcn = oEvent.getSource().getSelectedKey();
      this._readAsicTable(sSelectedAcn);

    },


    /**
     * Read the ABR table and enhance it with the ATO table as well.
     * @param  {[type]} sAbn [as described]
     * @return {[type]}      [description]
     */
    _readAbrTable: function(sAbn) {

      let oController = this;
      oController.getModel("scvExplorerModel").read("/abrRegistrationParameters(IP_SCV_ID='" + oController.oPageParam.scvId +
        "',IP_YEAR='9999',IP_ABN='" + sAbn + "')/Results", {

          success: function(data) {

            //if (data.results.length > 0) {
              //build abr table and transposing as necessary.
              oController._buildAbrTable(data.results[0]);

              oController.getModel("scvExplorerModel").read("/atoRegistrationParameters(IP_SCV_ID='" + oController.oPageParam.scvId +
                "',IP_YEAR='9999',IP_NUMBER='" + sAbn + "',IP_SOURCE='ABR')/Results", {

                  success: function(data) {

                    if (data.results.length > 0) {
                      //build abr table and transposing as necessary.
                      oController._enhanceAbrTable(data.results);
                    }

                  },
                  error: function(oMessage) {
                    console.log(oMessage);
                  }
                });
            //}

          },
          error: function(oMessage) {
            console.log(oMessage);
          }
        });
    },

    /** Read ASIC table in the Registration tab
		 * Once read enhance it with the ATO table.
     * @param  {[type]} sAcn [As described]
     * @return {[type]}      [description]
     */
    _readAsicTable: function(sAcn) {
      let oController = this;
      oController.getModel("scvExplorerModel").read("/asicRegistrationParameters(IP_SCV_ID='" + oController.oPageParam.scvId +
        "',IP_YEAR='9999',IP_ACN='" + sAcn + "')/Results", {

          success: function(data) {

              //build abr table and transposing as necessary.
              oController._buildAcnTable(data.results[0]);

              oController.getModel("scvExplorerModel").read("/atoRegistrationParameters(IP_SCV_ID='" + oController.oPageParam.scvId +
                "',IP_YEAR='9999',IP_NUMBER='" + sAcn + "',IP_SOURCE='ASIC')/Results", {

                  success: function(data) {

                    if (data.results.length > 0) {
                      //build abr table and transposing as necessary.
                      oController._enhanceAsicTable(data.results);
                    }

                  },
                  error: function(oMessage) {
                    console.log(oMessage);
                  }
                });


          },
          error: function(oMessage) {
            console.log(oMessage);
          }
        });
    },

    _enhanceAsicTable: function (oAtoPayload){

      let oController = this;
      let oCurrentAcnModel = oController.getModel("acnModel").getData();

      //run through the prefix ABR table
      for (let iCounter = 0; iCounter < oAtoPayload.length; iCounter++) {

      	if(oAtoPayload[iCounter].PARENT_ACN && oAtoPayload[iCounter].STD_PARENT_NAME_ORG){

      		oCurrentAcnModel[9].CODECOLUMN += (oAtoPayload[iCounter].PARENT_ACN  || "No entry") + " " + (oAtoPayload[iCounter].STD_PARENT_NAME_ORG || "No entry") + "\n\n";
      	}

      }
      oController.getModel("acnModel").setData(oCurrentAcnModel, true);
    },

	/**
	 * Enhance the ABR table base of the ATO table.
	 * @param  {[type]} oAtoPayload [the result payload]
	 * @return {[type]}             [description]
	 */
    _enhanceAbrTable: function(oAtoPayload) {
      let oController = this;
      let oCurrentAbrModel = oController.getModel("abrModel").getData();
      let mCodeChecker = []; //checker for ANZIC_CD
      let mDesChecker = []; //checker for ANZIC_DESC
      //run through the prefix ABR table
      for (let iCounter = 0; iCounter < oAtoPayload.length; iCounter++) {

        let sCapCurrentAnzicCode = oAtoPayload[iCounter].ANZSIC_CD.toUpperCase();
        let sCapCurrentAnzicDesc = oAtoPayload[iCounter].ANZSIC_DESC.toUpperCase();

        if( mCodeChecker.indexOf(sCapCurrentAnzicCode) === -1  && mDesChecker.indexOf(sCapCurrentAnzicDesc) === -1 ){
          mCodeChecker.push(sCapCurrentAnzicCode);
          mDesChecker.push(sCapCurrentAnzicDesc);
          //push it to the model without transforming what it looks like.
          oCurrentAbrModel[2].CODECOLUMN += oAtoPayload[iCounter].ANZSIC_CD + "\n\n";
          oCurrentAbrModel[2].DESCOLUMN += oAtoPayload[iCounter].ANZSIC_DESC + "\n\n";
        }

      }
      oController.getModel("abrModel").setData(oCurrentAbrModel, true);
    },

	/**
	 * Build the ABR base on the payload, tranpose it the result
	 * and allow it to have a more granular control of the fields.
	 * @param  {[type]} oPayload [Load from the AJAX call]
	 * @return {[type]}          [description]
	 */
    _buildAbrTable: function(oPayload) {
      let oController = this;
      let oFinalResult = [];

	  if(typeof oPayload === "undefined"){
	  	oPayload = {};
	  }

      let oCollection = {};
      oCollection.ABR = [];
      let oBaseObj = function() {
        this.SOURCE = "ABR";
      };
      //build the table
      let oRow = new oBaseObj();
      oRow.DESC = "Entity Type";
      oRow.CODECOLUMN = oPayload.ENT_TYP_CD || "";
      oRow.DESCOLUMN = oPayload.ENT_TYP_CD_DESC || "";
      oFinalResult.push(oRow);

      let oSecondRow = new oBaseObj();
      oSecondRow.DESC = "ANZSIC (Industry Code)";
      oSecondRow.CODECOLUMN = oPayload.ANZSIC_CD || "";
      oSecondRow.DESCOLUMN = oPayload.ANZSIC_DESC || "";
      oFinalResult.push(oSecondRow);

      let oThirdRow = new oBaseObj();
      oThirdRow.SOURCE = "ATO";
      oThirdRow.DESC = "ANZSIC (Industry Code)";
      oThirdRow.CODECOLUMN = "";
      oThirdRow.DESCOLUMN = "";
      oFinalResult.push(oThirdRow);

      let oFourthRow = new oBaseObj();
      oFourthRow.DESC = "ABN RegDate";
      oFourthRow.CODECOLUMN = Formatters.formatDateObjectToString(oPayload.REGN_START_DT) || "";
      oFourthRow.DESCOLUMN = "";
      oFinalResult.push(oFourthRow);

      let oFifthRow = new oBaseObj();
      oFifthRow.DESC = "ABN CancelDate";
      oFifthRow.CODECOLUMN = Formatters.formatDateObjectToString(oPayload.REGN_CANCN_DT);
      oFifthRow.DESCOLUMN = "";
      oFinalResult.push(oFifthRow);

      let oSixthRow = new oBaseObj();
      oSixthRow.DESC = "GST RegDate";
      oSixthRow.CODECOLUMN = Formatters.formatDateObjectToString(oPayload.GST_REGN_DT);
      oSixthRow.DESCOLUMN = "";
      oFinalResult.push(oSixthRow);

      let oSeventhRow = new oBaseObj();
      oSeventhRow.DESC = "GST CancelDate";
      oSeventhRow.CODECOLUMN = Formatters.formatDateObjectToString(oPayload.GST_CANCN_DT);
      oSeventhRow.DESCOLUMN = "";
      oFinalResult.push(oSeventhRow);

      let oEightRow = new oBaseObj();
      oEightRow.DESC = "Register Charity";
      oEightRow.CODECOLUMN = oPayload.FUND_CHARITY_CODE;
      oEightRow.DESCOLUMN = oPayload.FUND_CHARITY_CODE_DESC || "";
      oFinalResult.push(oEightRow);

      let oNinthRow = new oBaseObj();
      oNinthRow.DESC = "Charity RegDate";
      oNinthRow.CODECOLUMN = Formatters.formatDateObjectToString(oPayload.CHARITY_REGN_DT);
      oNinthRow.DESCOLUMN = "";
      oFinalResult.push(oNinthRow);

      let oTenthRow = new oBaseObj();
      oTenthRow.DESC = "Charity CancelDate";
      oTenthRow.CODECOLUMN = Formatters.formatDateObjectToString(oPayload.CHARITY_CANCN_DT);
      oTenthRow.DESCOLUMN = "";
      oFinalResult.push(oTenthRow);

      oController.getModel("abrModel").setData(oFinalResult, true);
    },

		/**
		 * Build the ASIC base on the payload, tranpose it the result
		 * and allow it to have a more granular control of the fields.
		 * @param  {[type]} oPayload [Load from the AJAX call]
		 * @return {[type]}          [description]
		 */
    _buildAcnTable: function(oPayload) {
      let oController = this;
      let oFinalResult = [];

      if(typeof oPayload === "undefined"){
	  	oPayload = {};
	  }

      let oCollection = {};
      oCollection.ABR = [];
      let oBaseObj = function() {
        this.SOURCE = "ASIC";
      };
      //build the table
      let oRow = new oBaseObj();
      oRow.DESC = "Org Type";
      oRow.CODECOLUMN = oPayload.ORG_TYPE || "";
      oFinalResult.push(oRow);

      let oSecondRow = new oBaseObj();
      oSecondRow.DESC = "Org Status";
      oSecondRow.CODECOLUMN = oPayload.ORG_STATUS || "";
      oFinalResult.push(oSecondRow);

      let oThirdRow = new oBaseObj();
      oThirdRow.DESC = "Deregistration Code";
      oThirdRow.CODECOLUMN = oPayload.DEREGISTRATION_CODE || "";
      oFinalResult.push(oThirdRow);

      let oFourthRow = new oBaseObj();
      oFourthRow.DESC = "ASIC RegDate";
      oFourthRow.CODECOLUMN = Formatters.formatDateObjectToString(oPayload.REGN_START_DT);
      oFinalResult.push(oFourthRow);

      let oFifthRow = new oBaseObj();
      oFifthRow.DESC = "ASIC RegEndDate";
      oFifthRow.CODECOLUMN = Formatters.formatDateObjectToString(oPayload.REGN_END_DT);
      oFinalResult.push(oFifthRow);

      let oSixthRow = new oBaseObj();
      oSixthRow.DESC = "Org Name Start";
      oSixthRow.CODECOLUMN = Formatters.formatDateObjectToString(oPayload.ORG_NAME_START_DT);
      oFinalResult.push(oSixthRow);

      let oSeventhRow = new oBaseObj();
      oSeventhRow.DESC = "Org Start Date";
      oSeventhRow.CODECOLUMN = Formatters.formatDateObjectToString(oPayload.ORG_START_DT);
      oFinalResult.push(oSeventhRow);

      let oGapRow = new oBaseObj();
      oGapRow.SOURCE = "";
      oGapRow.DESC = "";
      oGapRow.CODECOLUMN = "";
      oFinalResult.push(oGapRow);

      let oEightRow = new oBaseObj();
      oEightRow.DESC = "Ultimate Holding Company";
      oEightRow.CODECOLUMN = (oPayload.PARENT_ACN  || "") + " " + (oPayload.STD_PARENT_NAME_ORG  || "");
      oFinalResult.push(oEightRow);

      let oNinthRow = new oBaseObj();
      oNinthRow.SOURCE = "ATO";
      oNinthRow.DESC = "Parent A.C.N and Name";
      oNinthRow.CODECOLUMN = "";
      oFinalResult.push(oNinthRow);

      oController.getModel("acnModel").setData(oFinalResult, true);
    },

    /**
     * Force the back button to go to homepage, without
     * taking into account the history of where it was from.
     */
    onNavBack: function() {

      this.getRouter().navTo("appHome");

    }
  });

  return DetailObject;
});
