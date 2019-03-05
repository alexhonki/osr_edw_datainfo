/*
 * Created by Stefanus
 * Base template for Organisation Explorer
 * 27.02.2019
 */
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/Fragment",
  "sap/m/MessageToast",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (SAPController, History, JSONModel, Fragment, MessageToast, Filter, FilterOperator) {
  "use strict";

  let SuperController = SAPController.extend("osr.edw.data.info.controller.SuperController", {

    /**
     * return the owner component event bus.
     * @return {[type]} [description]
     */
    getEventBus: function () {
      return this.getOwnerComponent().getEventBus();
    },

    /**
     * Return the router object
     * @return {[type]} [description]
     */
    getRouter: function () {
      return sap.ui.core.UIComponent.getRouterFor(this);
    },

    /**
     * Convenience method for setting the view model in every controller of the application.
     * @public
     * @param {sap.ui.model.Model} oModel the model instance
     * @param {string} sName the model name
     * @returns {sap.ui.mvc.View} the view instance
     */
    setModel: function (oModel, sName) {
      return this.getView().setModel(oModel, sName);
    },

    /**
     * Get model for the view caller.
     * @param  {[type]} sName [name of the model]
     * @return {[Model]}      [return the required model]
     */
    getModel: function (sName) {
      return this.getView().getModel(sName);
    },

    /**
     * Get the model that is set in the component.js
     * to make sure we always have access to it.
     * @param  {[type]} sName [name of the model]
     * @return {[type]}       []
     */
    getOwnerComponentModel: function (sName) {
      return this.getOwnerComponent().getModel(sName);
    },

    /**
     * [Main navigation helper for the app.]
     * @param  {[type]} sRouteName [the routeName base on the manifest ]
     * @return {[type]}            []
     */
    mainNavHelper: function (sRouteName, oParam) {
      this.getRouter().navTo(sRouteName, oParam);
    },

    /**
     * Responsible for navigating back to the previous page, in the case there isnt
     * it will default the back to the app home page
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    onNavBack: function (oEvent) {

      // By convention, every component has a 'home' route. This allows the fall back case where
      // there is no history in the browser, the back button will map to the relavant home screen
      let oHistory;
      let sPreviousHash;
      oHistory = History.getInstance();
      sPreviousHash = oHistory.getPreviousHash();
      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getRouter().navTo("appHome", {}, true /*no history*/ );
      }

    },

    /**
     * Generic function to initialize a dialog.
     * @param  {String} sDialogName     The name of the dialog fragment file.
     * @param  {String} sDialogPath     The path where the dialog fragment file located in.
     * @return {sap.ui.core.Control}    Dialog control.
     */
    initializeDialog: function (sDialogName, sDialogPath, sControllerPath) {

      let dialogController = sap.ui.controller(sControllerPath);

      // assign this controller (the controller from the calling method) to the dialog controller
      // to have access to the controller that call this, in case we want to access anything inside it.
      dialogController.ownerController = this;

      let sDialogId = this.makeRandomId();
      sDialogId += sDialogName;
      dialogController.dialog = sap.ui.xmlfragment(sDialogId, sDialogPath + sDialogName, dialogController);

      //dialogController.dialog = sap.ui.xmlfragment(sDialogName, sDialogPath + sDialogName, dialogController);

      // need to assign the controller to the dialog to be able to access the data in case the dialog exists
      dialogController.dialog.controller = dialogController;

      // add dialog as dependent.
      this.getView().addDependent(dialogController.dialog);

      return dialogController.dialog;
    },

    /**
     * Generate random id base on letters and 8 chars.
     * @return {[type]} [description]
     */
    makeRandomId: function () {
      let text = "";
      let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

      for (let i = 0; i < 8; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }

      return text;
    },

    /**
     * Send message toast helper.
     * @param  {[type]} sMessage [description]
     * @return {[type]}          [description]
     */
    sendMessageToast: function (sMessage) {
      MessageToast.show(sMessage, {
        duration: 3000
      });
    },

    /**
     * triggere busy indicator for the entire screen and disable everything.
     * @param  {[type]} bOpen [description]
     * @return {[type]}       [description]
     */
    showBusyIndicator: function (bOpen) {

      if (bOpen) {
        sap.ui.core.BusyIndicator.show(0);
      } else {
        sap.ui.core.BusyIndicator.hide();
      }

    }

  });

  return SuperController;
});
