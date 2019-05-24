sap.ui.define(['jquery.sap.global'], function () {
	"use strict";

	let oFormatter = {

		/**
		 * use moment to return the date in the string e.g 12/12/2017
		 * @param  {[type]} oTime [date object]
		 * @return {[type]}       [string date]
		 */
		formatDateObjectToString: function (oTime) {
			if (typeof oTime === "undefined" || oTime === null || oTime === "") {
				return "No date";
			} else {
				return moment(oTime).format("DD/MM/YYYY");
			}

		},
		
		formatStringToBoolean: function(sStatus){
			if (sStatus === "Y") {
				return true;
			} else{
				return false;
			}
		},

		/**
		 * Format postal information depending on whether there is text or not
		 * @param  {[type]} sText [String containing the data]
		 * @return {[type]}       [string date]
		 */
		formatNoDataTextPostal: function (sText) {
			if (typeof sText === "undefined" || sText === "") {
				return "No PO Box for this."
			} else {
				return sText;
			}
		},

		/**
		 * Format postal information depending on whether there is text or not
		 * @param  {[type]} sText [String containing the data]
		 * @return {[type]}       [string date]
		 */
		formatAddressKind: function (sText) {
			if (typeof sText === "undefined" || sText === "") {
				return "No Kind."
			} else if (sText === "TMR") {
				return "EXT_TMR";
			} else {
				return sText;
			}
		},

		formatActiveFlag: function (sInactive, sNameOrg1, sNameOrg2, sNameOrg3, sEntTypCd) {
			
			if (sInactive === "X") {
				this.addStyleClass("identificationTableInactive");
			} else {
				this.addStyleClass("identificationTableActive");
			}

			if (sEntTypCd === "IND") {
				return sNameOrg2 + " " + sNameOrg3;
			} else {
				return sNameOrg1;
			}
		},
		
		akaNamesFormatter: function (sNameOrg1, sNameOrg2, sNameOrg3, sNameTrdg, sSourceType, sEntTypCd) {
			if (sSourceType === "TRADING") {
				return sNameTrdg;
			} else if (sEntTypCd === "IND") {
				return sNameOrg2 + " " + sNameOrg3;
			} else {
				return sNameOrg1;
			}
		}

	};

	return oFormatter;

});