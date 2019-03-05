/*
 * Created by Stefanus
 * Base template for Organisation Explorer
 * 19.09.2018
 */
sap.ui.define([
  "osr/scv/org/explorer/controller/SuperController",
  "sap/ui/model/json/JSONModel"
], function(SuperController, JSONModel) {
  "use strict";

  let NotFoundController = SuperController.extend("osr.edw.data.info.controller.NotFound", {

    /**
     * On initialize
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    onInit: function(oEvent) {

    },

    /**
     * Lifecycle hook of UI5.
     */
    onAfterRendering: function() {

    },

    onNavBack: function(oEvent) {

      this.getRouter().navTo("homepage", {}, true /*no history*/ );

    }

  });

  return NotFoundController;
});
