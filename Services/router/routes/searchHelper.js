/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
const express = require("express");
const async = require("async");

module.exports = {

  //show response from the query within URL
  executeSearch: function(oRequest, oResponse) {

    let oFinalQuery = this._checkRequest(oRequest, oResponse, oRequest.query);

    return oFinalQuery;
  },

  /**
   * Helper to execute API search call
   * @param  {[type]} oRequest  [request object for the http call]
   * @param  {[type]} oResponse [response object for the HTTP call ]
   * @param  {[type]} oQuery    [query pbject from the url ]
   * @return {[type]}           [description]
   */
  _checkRequest: function(oRequest, oResponse, oQuery) {

    // different query param that could come in
    // oQuery.query;
    // oQuery.city_registration;
    // oQuery.business_location;
    // oQuery.industry_code;
    // oQuery.email;
    // oQuery.phone_num;
    // oQuery.iFuzzy;
    // oQuery.asic_status;
    //do check for each variable being passed on.
    if (typeof oQuery.iFuzzy === "undefined" || oQuery.iFuzzy === "") {
      oQuery.iFuzzy = 0.8; // default to 0.8 if none set.
    }

    //to hold all the different advance filter in array
    //so it can be transform to fit into the main SQL statement
    let aAdvanceFilter = [];

	if (typeof oQuery.asic_status !== "undefined" && oQuery.asic_status !== "") {

      //craft sql statements for City of Registration
      let sAsicStatusSql = "s.SCV_ID IN (SELECT DISTINCT SCV_ID FROM \"osr.scv.org.foundation.db.data::SCVFoundation.Organisation\" " +
        "WHERE (SOURCE='ASIC' AND UPPER(ORG_STATUS)=UPPER('"+oQuery.asic_status+"') )) ";
      aAdvanceFilter.push(sAsicStatusSql);
    }

    if (typeof oQuery.city_registration !== "undefined" && oQuery.city_registration !== "") {

      //craft sql statements for City of Registration
      let sCityRegSql = "s.SCV_ID IN (SELECT DISTINCT SCV_ID FROM \"osr.scv.org.foundation.db.data::SCVFoundation.Address\" " +
        "WHERE (ADR_KIND='ASIC_REGAU' AND UPPER(STD_ADDR_LOCALITY) LIKE UPPER('%" + oQuery.city_registration + "%') )) ";
      aAdvanceFilter.push(sCityRegSql);
    }

    if (typeof oQuery.business_location !== "undefined" && oQuery.business_location !== "") {

      //craft sql statements for Business Location
      let sCityBusLoc = "s.SCV_ID IN (SELECT DISTINCT SCV_ID FROM \"osr.scv.org.foundation.db.data::SCVFoundation.Address\" " +
        "WHERE (ADR_KIND='ASIC_REG' AND UPPER(STD_ADDR_LOCALITY) LIKE UPPER('%" + oQuery.business_location + "%') )) ";
      aAdvanceFilter.push(sCityBusLoc);
    }

    if (typeof oQuery.industry_code !== "undefined" && oQuery.industry_code !== "") {
    	//craft sql statements for Business Location
      let sIndustCode = "s.SCV_ID IN (SELECT DISTINCT SCV_ID FROM \"osr.scv.org.foundation.db.data::SCVFoundation.Organisation\" " +
        "WHERE (UPPER(ANZSIC_CD)='"+ oQuery.industry_code.toUpperCase() +"' )) ";
      aAdvanceFilter.push(sIndustCode);
    }

    if (typeof oQuery.email !== "undefined" && oQuery.email !== "") {

	let sEmailQuery = "s.SCV_ID IN (SELECT DISTINCT SCV_ID FROM \"osr.scv.org.foundation.db.data::SCVFoundation.ContactEmail\" " +
        "WHERE (UPPER(STD_EMAIL)='" + oQuery.email.toUpperCase() + "' )) ";
      aAdvanceFilter.push(sEmailQuery);

    }

    if (typeof oQuery.phone_num !== "undefined" && oQuery.phone_num !== "") {

        let sContactQuery = "s.SCV_ID IN (SELECT DISTINCT SCV_ID FROM \"osr.scv.org.foundation.db.data::SCVFoundation.ContactNumber\" " +
        "WHERE (CONTACT_NUMBER='" + oQuery.phone_num + "' )) ";
      aAdvanceFilter.push(sContactQuery);
    }

	//check for completely empty search with nothing else but fuzzy

	if(oQuery.query === "" && aAdvanceFilter.length < 1){
		oResponse.type("application/json").status(200).send("No Data");
		return;
	}

	if (oQuery.query === "") {
      delete oQuery.query;
    }

    let oPayloadToExecute = {};

    //structured
    //name , city of registration, business location, industry code, email and phone number
    oPayloadToExecute = this.getFinalLoadForExecution(oQuery, oQuery.sScvId, oQuery.sSource, oQuery.sSourceId, aAdvanceFilter);

    let oClient = oRequest.db;
    let oController = this;

    //if the execution contain number, do a different search
    if (oPayloadToExecute.bContainerNumber) {


      let sFinalSql = oController._getSearchTableOnScvId(oPayloadToExecute);

      async.waterfall([

        function prepare(callback) {
          oClient.prepare(
            sFinalSql,
            function(err, statement) {
              callback(null, err, statement);
            });
        },

        function execute(err, statement, callback) {
          statement.exec([], function(execErr, results) {
            callback(null, execErr, results);
          });
        },
        function response(err, results, callback) {
          if (err) {
            oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
            return;
          } else {
            let oFinalResult = oController.transformResults(results); //transform the results
            let result = JSON.stringify({
              Total: results.length,
              Results: oFinalResult
            });
            oResponse.type("application/json").status(200).send(result);
          }
          callback(null, results);
        }
      ], function(err, result) {

        if (err) {
          console.log(err);
        }

      });


    } else {

      //if the search does not contain any number, do a normal search as is.
      async.waterfall([
        function prepare(callback) {
          oClient.prepare(
            oPayloadToExecute.sFinalSearchString,
            function(err, statement) {
              callback(null, err, statement);
            });
        },

        function execute(err, statement, callback) {
          statement.exec([], function(execErr, results) {
            callback(null, execErr, results);
          });
        },
        function response(err, results, callback) {
          if (err) {
            oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
            return;
          } else {
            let oFinalResult = oController.transformResults(results); //transform the results
            let result = JSON.stringify({
              Total: results.length,
              Results: oFinalResult
            });
            oResponse.type("application/json").status(200).send(result);
          }
          callback(null, results);
        }
      ], function(err, result) {
        if (err) {
          console.log(err);
        }
      });
    }

  },

  /**
   * Search the search table, transform the results and send response to the browser.
   * @param  {[type]} oPayload     [payload]
   */
  _getSearchTableOnScvId: function(oPayload) {

    let sSecondQuery =
      "SELECT DISTINCT s.SCV_ID, org.SOURCE_ID as \"RMS_BP\", s.SEARCH_STRING_CLEANSED, s.SOURCE " +
      "FROM \"osr.scv.org.foundation.db.data::SCVFoundation.Search\" s " +
      "INNER JOIN \"osr.scv.org.foundation.db.data::SCVFoundation.Organisation\" org " +
      "ON s.SCV_ID = org.SCV_ID AND org.SOURCE='RMS' and org.INACTIVE != 'X' " +
      "WHERE s.SCV_ID IN (" + oPayload.sFinalSearchString + ") ORDER BY (CASE WHEN s.SOURCE LIKE '%ASIC%' THEN 0 WHEN s.SOURCE LIKE '%RMS%' THEN 1 ELSE 2 END)ASC";
    return sSecondQuery;

  },

  getFinalLoadForExecution: function(oQuery, sScvId, sSource, sSourceId, aAdvanceFilter) {

    //FIELD CODE
    //ANZSIC_CD - INDUST CODE - Partner table
    //STD_EMAIL - Email - ContactEmail table
    //TEL_NUMBER - Contact - ContactNumber table
    // CITY of Registration (ASIC Address Type = RP)
    // Business Location (ASIC Address Type = PA)
    // ## FOR NAME SEARCH ##
    //NAME_ORG1 ~ NAME_ORG4 - Partner table
    //STD_FIRM ~ STD_FIRM4 - Partner table
    //NAME_TRDG - TradingName Table

    //3 criterias for the WHERE clause
    //sourceid e.g 0001350449
    //scvid e.g 2005337 - unique entry to the table for the organisation
    //source e.g RMS, ABR, ATO, ASIC, TMR

    //determine whether we can search straight away

    let oContainNumbers = this._determineSearchAction(oQuery.query);
    let oStatements = [];
    let oFinalPayload = {};
    if (typeof oContainNumbers !== "undefined") {
      // Different entry points for the organisation

      //search the table base on a specific number given from the users
      // oResult.sABN = "00" + sFinalSourceId; //add manually to adjust for 11chars
      // oResult.sACN = sFinalSourceId;
      // oResult.sRMS = "0" + sFinalSourceId; //add manually to adjust for 10chars
      // oResult.sOriginalString = aQueryWords[key];
      oFinalPayload.bContainerNumber = true;
      let sFirstQuery =
        "SELECT DISTINCT SCV_ID " +
        "FROM \"osr.scv.org.foundation.db.data::SCVFoundation.Organisation\" " +
        "WHERE (ABN='" + oContainNumbers.sABN + "' OR ACN='" + oContainNumbers.sACN + "' OR SOURCE_ID='" + oContainNumbers.sRMS + "' OR ABN='" + oContainNumbers.sOriginalString + "' OR ACN='" + oContainNumbers.sOriginalString + "' OR SOURCE_ID='" + oContainNumbers.sOriginalString + "')";

      oFinalPayload.sFinalSearchString = sFirstQuery;;

    } else {

      oFinalPayload.bContainerNumber = false;
      let sFrontQuery;
      let sEndingQuery;
      if(typeof oQuery.query === "undefined"){
        sFrontQuery =
          "SELECT DISTINCT s.SCV_ID, org.SOURCE_ID as \"RMS_BP\", s.SEARCH_STRING_CLEANSED, s.SOURCE " +
          "FROM \"osr.scv.org.foundation.db.data::SCVFoundation.Search\" s " +
          "INNER JOIN \"osr.scv.org.foundation.db.data::SCVFoundation.Organisation\" org " +
          "ON s.SCV_ID = org.SCV_ID AND org.SOURCE='RMS' AND org.INACTIVE != 'X' " +
          "WHERE \"SEARCH_STRING_CLEANSED\" IS NOT NULL AND ";

        sEndingQuery = "ORDER BY (CASE WHEN s.SOURCE LIKE '%ASIC%' THEN 0 WHEN s.SOURCE LIKE '%RMS%' THEN 1 ELSE 2 END)ASC";
      }else{
        //NOT NULL is used for fail safe in case there's NULL happening in the table itself.
        sFrontQuery =
          "SELECT DISTINCT s.SCV_ID, org.SOURCE_ID as \"RMS_BP\", s.SEARCH_STRING_CLEANSED, s.SOURCE, SCORE() as \"SCORE\" " +
          "FROM \"osr.scv.org.foundation.db.data::SCVFoundation.Search\" s " +
          "INNER JOIN \"osr.scv.org.foundation.db.data::SCVFoundation.Organisation\" org " +
          "ON s.SCV_ID = org.SCV_ID AND org.SOURCE='RMS' AND org.INACTIVE != 'X' " +
          "WHERE \"SEARCH_STRING_CLEANSED\" IS NOT NULL AND ";

        sEndingQuery = "CONTAINS (SEARCH_STRING_CLEANSED, '" + oQuery.query + "', FUZZY (0.8)) ORDER BY (CASE WHEN s.SOURCE LIKE '%ASIC%' THEN 0 WHEN s.SOURCE LIKE '%RMS%' THEN 1 ELSE 2 END) ASC, " +
          "\"SCORE\" DESC";
      }


      if (typeof sScvId !== "undefined" && sScvId !== null) {
        sFrontQuery += " \"SCV_ID\" LIKE '%" + sScvId + "%' AND";
      }

      if (typeof sSource !== "undefined" && sSource !== null) {
        sFrontQuery += " \"SOURCE\" LIKE '%" + sSource + "% AND";
      }

      if (typeof sSourceId !== "undefined" && sSourceId !== null) {
        sFrontQuery += " \"SOURCE_ID\" LIKE '%" + sSourceId + "% AND ";
      }

      //manipulate final string with the given array for the advance filter
      for (let iCounter = 0; iCounter < aAdvanceFilter.length - 1; iCounter++) {
        sFrontQuery += aAdvanceFilter[iCounter] + " AND ";
      }

      //need to check whether there's a query or not
      // if not, then just add the last statement
      // if yes, then add last statement with "AND" because of the contains predicate structure
      if(typeof oQuery.query === "undefined"){
      	sFrontQuery += aAdvanceFilter[aAdvanceFilter.length-1];
      }else{
      	if(aAdvanceFilter.length>0){
      		sFrontQuery += aAdvanceFilter[aAdvanceFilter.length-1] + " AND ";
      	}

      }

      //build the back part of the query.
      sFrontQuery += sEndingQuery;
      oFinalPayload.sFinalSearchString = sFrontQuery;

    }

    //return the built sql search string.
    return oFinalPayload;

  },

  /**
   * get chosen if we are only searching the source id.
   * NOT NULL is used for fail safe in case there's NULL happening
   * on the Search table.
   */
  getSourceIdSearchOnly: function() {
    let sFrontQuery =
      "SELECT DISTINCT \"SCV_ID\", \"SEARCH_STRING_CLEANSED\" " +
      "FROM \"osr.scv.foundation.db.data::SCVFoundation.Search\" WHERE \"SEARCH_STRING_CLEANSED\" IS NOT NULL AND \"SOURCE_ID\" = ? ";

    return sFrontQuery;
  },

  /**
   * get chosen when we are searching the source id and this because the length
   * of SCV ID could be in the same region as driver and RMS BP number or TMR number.
   * NOT NULL is used for fail safe in case there's NULL happening
   * on the Search table.
   */
  getScvIdSearchOnly: function() {
    let sFrontQuery =
      "SELECT DISTINCT \"SCV_ID\", \"SEARCH_STRING_CLEANSED\" " +
      "FROM \"osr.scv.foundation.db.data::SCVFoundation.Search\" WHERE \"SEARCH_STRING_CLEANSED\" IS NOT NULL AND \"SCV_ID\" = ? ";
    return sFrontQuery;
  },

  /**
   * Transform result before spitting out the data, so that no pre-processing
   * happen in the front-end to reduce load for the browsers.
   * @return  {[Array]} oFinalData [contain all pre-processed result and distinct]
   */
  transformResults: function(oResultRows) {

    let oFinalData = [];
    let aIdChecker = []; //use to check whether an id exist or not
    let aIndexToRemove = [];

    //transform the data according to the results.
    for (let i = 0; i < oResultRows.length; i++) {

      //pre-process the result and split base on "|"
      let aSplitResult = oResultRows[i].SEARCH_STRING_CLEANSED.split("|");

      //if it does not exist add it into the result.
      if (aIdChecker.indexOf(oResultRows[i].SCV_ID) === -1) {

        //push this SCV ID into the array for checking next.
        aIdChecker.push(oResultRows[i].SCV_ID);

        oResultRows[i].ACN = aSplitResult[5];
        oResultRows[i].ORG_NAME = aSplitResult[0] + " " + aSplitResult[1] ;
        oResultRows[i].CITY_OF_REGISTRATION = aSplitResult[7];
        oResultRows[i].ASIC_STATUS = aSplitResult[6];

        oFinalData.push(oResultRows[i]);

      } else if (aIdChecker.indexOf(oResultRows[i].SCV_ID) !== -1) { //an entity id already exist
        //check that the entity id address oFinalData is not empty

        if (aSplitResult.length === 10) {

          this._checkAddressIsNotEmpty(oFinalData, aSplitResult.length, aSplitResult[3], aSplitResult[4], oResultRows[i].SCV_ID);

        } else if (aSplitResult.length === 11) {

          this._checkAddressIsNotEmpty(oFinalData, aSplitResult.length, aSplitResult[4], aSplitResult[5], oResultRows[i].SCV_ID);

        }

      }

    }

    return oFinalData;
  },

  /**
   * Check whether an address is empty and if it is ignore it.
   * @param  {[type]} oFinalData    [description]
   * @param  {[type]} iResultLength [description]
   * @param  {[type]} sCity         [description]
   * @param  {[type]} sPostalCode   [description]
   * @param  {[type]} sCurrentScvId [description]
   * @return {[type]}               [description]
   */
  _checkAddressIsNotEmpty: function(oFinalData, iResultLength, sCity, sPostalCode, sCurrentScvId) {
    for (let i = 0; i < oFinalData.length; i++) {
      if (oFinalData[i].SCV_ID === sCurrentScvId) {
        if (oFinalData[i].CITY === "" || oFinalData[i].POSTAL_CODE === "") {
          oFinalData[i].CITY = sCity;
          oFinalData[i].POSTAL_CODE = sPostalCode;
          break;
        }
      }
    }
  },

  /**
   * Reverse the string of DOB for the SCV.
   * Split base on the '-'
   * reverse the array with reverse
   * join it back with seperator of '/'
   */
  _reverseStringDOB: function(str) {
    return str.split("-").reverse().join("/");
  },

  /**
   * Function helper to determine whether a string contain number
   * @param  {[String]} sString [a string]
   * @return {[Boolean]}        [true or false depending on the regex]
   */
  _hasNumber: function(sString) {
    return /\d/.test(sString);
  },

  /**
   * Function helper to determine whether the search action
   * Will return an object in the event
   * @param  {[String]} sQuery [a string]
   * @return {[Object]}        [object containing numbers to search through]
   */
  _determineSearchAction: function(sQuery) {

    let oResult = {};

    //check whether the string contain number first or not
    //then do accordingly
    if (this._hasNumber(sQuery)) {
      let aQueryWords = sQuery.split(" ");
      //loop through each word in the query.
      for (let key in aQueryWords) {

        //check this word is a number or not.
        let bContainNumber = this._hasNumber(aQueryWords[key]);

        //if yes, then check length of the number to determine our source id.
        if (bContainNumber) {
          //a min of 7 characters to trigger this
          if (aQueryWords[key].length > 6) {
            //if the number is less than 9, add further zero infront
            //to pad and make sure its consistent.
            //so that all of them are added automatically
            let iLetterDiff = 9 - aQueryWords[key].length;
            let sFinalSourceId = aQueryWords[key];
            for (let i = 0; i < iLetterDiff; i++) {
              sFinalSourceId = "0" + sFinalSourceId;
            }

            // Different entry points for the organisation
            // ACN - 9 char
            // RMS BP - SOURCE_ID 10 char
            // ABN - 11 char
            oResult.sABN = "00" + sFinalSourceId; //add manually to adjust for 11chars
            oResult.sACN = sFinalSourceId;
            oResult.sRMS = "0" + sFinalSourceId; //add manually to adjust for 10chars
            oResult.sOriginalString = aQueryWords[key]; //to search through TMR without the zeros
          } else {
          	return; //do nothing since number is below threshold
          }
        }
      }
      return oResult;
    } else {
      return; // do nothing and terminate
    }

  },

  /**
   * Grab current contact details of a particular org for current tab
   * @param  {[type]} oRequest  [description]
   * @param  {[type]} oResponse [description]
   * @return {[type]}           [description]
   */
  getContact: function(oRequest, oResponse) {
    let oQuery = oRequest.query;
    let sFinalSearchString =
      "SELECT \"SOURCE\", \"SCV_ID\", \"TELEPHONE\", \"MOBILE\", \"STD_EMAIL\" " +
      "FROM \"osr.scv.org.foundation.db.views.Explorer::CV_ContactByScvId\" " +
      "(PLACEHOLDER.\"$$IP_SCV_ID$$\"=>'" + oQuery.scvId + "'," +
      "PLACEHOLDER.\"$$IP_YEAR$$\"=>'" + oQuery.year + "')" +
      "ORDER BY (CASE WHEN SOURCE LIKE '%TMR%' THEN 0 WHEN SOURCE LIKE '%ATO%' THEN 1 WHEN SOURCE LIKE '%ABR%' THEN 2 ELSE 3 END)ASC";

    let client = oRequest.db;
    let oController = this;
    async.waterfall([

      function prepare(callback) {
        client.prepare(
          sFinalSearchString,
          function(err, statement) {
            callback(null, err, statement);
          });
      },

      function execute(err, statement, callback) {
        statement.exec([], function(execErr, results) {
          callback(null, execErr, results);
        });
      },
      function response(err, results, callback) {
        if (err) {
          oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
          return;
        } else {
          let oFinalResult = oController.transformContactResults(results);
          let result = JSON.stringify({
            Total: results.length,
            Results: oFinalResult
          });
          oResponse.type("application/json").status(200).send(result);
        }
        callback(null, results);
      }
    ], function(err, result) {
      let temp = 1;
    });

  },

  /**
   * Use to transform the results of a contact results base on the
   * very first results of an available contact
   * @param  {[type]} oPayload [description]
   * @return {[type]}          [description]
   */
  transformContactResults: function(oPayload) {
    let oFinalResult = {};

    for (let i = 0; i < oPayload.length; i++) {
      if (oPayload[i].MOBILE && typeof oFinalResult.MOBILE === "undefined") {
        oFinalResult.MOBILE = oPayload[i].MOBILE;
      }

      if (oPayload[i].TELEPHONE && typeof oFinalResult.TELEPHONE === "undefined") {
        oFinalResult.TELEPHONE = oPayload[i].TELEPHONE;
      }

      if (oPayload[i].STD_EMAIL && typeof oFinalResult.STD_EMAIL === "undefined") {
        oFinalResult.STD_EMAIL = oPayload[i].STD_EMAIL;
      }

      if (oFinalResult.MOBILE && oFinalResult.TELEPHONE && oFinalResult.STD_EMAIL) {
        break;
      }
    }

    return oFinalResult;
  }

};
