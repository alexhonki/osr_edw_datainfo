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
