/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
const express = require("express");
const async = require("async");
const hanaClient = require("@sap/hana-client");

module.exports = {

	//show response from the query within URL
	executeSearch: function (oRequest, oResponse) {

		let oFinalQuery = this._checkRequest(oRequest, oResponse, oRequest.query);

		return oFinalQuery;
	},

	/**
	 * Reverse the string of DOB for the SCV.
	 * Split base on the '-'
	 * reverse the array with reverse
	 * join it back with seperator of '/'
	 */
	_reverseStringDOB: function (str) {
		return str.split("-").reverse().join("/");
	},

	/**
	 * Function helper to determine whether a string contain number
	 * @param  {[String]} sString [a string]
	 * @return {[Boolean]}        [true or false depending on the regex]
	 */
	_hasNumber: function (sString) {
		return /\d/.test(sString);
	},

	/**
	 * Grab current contact details of a particular org for current tab
	 * @param  {[type]} oRequest  [description]
	 * @param  {[type]} oResponse [description]
	 * @return {[type]}           [description]
	 */
	getContact: function (oRequest, oResponse) {
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
					function (err, statement) {
						callback(null, err, statement);
					});
			},

			function execute(err, statement, callback) {
				statement.exec([], function (execErr, results) {
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
		], function (err, result) {
			if (err) {
				oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
				return;
			}
		});

	},

	/**
	 * Grab current contact details of a particular org for current tab
	 * @param  {[type]} oRequest  [description]
	 * @param  {[type]} oResponse [description]
	 * @return {[type]}           [description]
	 */
	getSources: function (oRequest, oResponse) {
		let oQuery = oRequest.query;
		let sFinalSearchString =
			"SELECT TO_VARCHAR(SOURCE_ID) AS SOURCE_ID, CREATED_AT,CREATED_BY,SOURCE_NAME " +
			"FROM \"osr.edw.source.data.info.db.data::DATA_INFO.SOURCES\" ";

		let client = oRequest.db;
		let oController = this;
		async.waterfall([

			function prepare(callback) {
				client.prepare(
					sFinalSearchString,
					function (err, statement) {
						callback(null, err, statement);
					});
			},

			function execute(err, statement, callback) {
				statement.exec([], function (execErr, results) {
					callback(null, execErr, results);
				});
			},
			function response(err, results, callback) {
				if (err) {
					oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				} else {
					//let oFinalResult = oController.transformContactResults(results);
					let result = JSON.stringify({
						Total: results.length,
						Results: results
					});
					oResponse.type("application/json").status(200).send(result);
				}
				callback(null, results);
			}
		], function (err, result) {
			console.log(err);
		});

	},

	createNewSource: function (oRequest, oResponse) {
		let oQuery = oRequest.query;
		let sGetUsername =
			"SELECT DISTINCT VALUE FROM \"PUBLIC\".\"M_SESSION_CONTEXT\" WHERE KEY='APPLICATIONUSER'";

		let client = oRequest.db;
		client.setAutoCommit(false);
		let oController = this;
		async.waterfall([

			function getUsername(callback) {
				client.prepare(
					sGetUsername,
					function (err, statement) {
						callback(null, err, statement);
					});
			},

			function executeGetUsername(err, statement, callback) {

				if (err) {
					client.rollback();
					oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				} else {
					statement.exec([], function (execErr, results) {
						callback(null, execErr, results);
					});
				}

			},
			function prepareInsertionToSourceTable(execErr, results, callback) {

				let sInsertToSource = "INSERT INTO \"osr.edw.source.data.info.db.data::DATA_INFO.SOURCES\" " +
					"(SOURCE_ID, CREATED_AT, CREATED_BY, SOURCE_NAME)" +
					"VALUES(SYSUUID,CURRENT_TIMESTAMP,'" + results[0].VALUE.toUpperCase() + "','" + oRequest.body.sSource.toUpperCase() + "')";

				client.prepare(
					sInsertToSource,
					function (err, statement) {
						callback(null, err, statement);
					});
			},
			function executeInsert(err, statement, callback) {

				if (err) {
					client.rollback();
					oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				} else {
					statement.exec([], function (execErr, results) {
						callback(null, execErr, results);
					});
				}

			},
			function finalResponse(err, results, callback) {
				if (err) {
					client.rollback();
					oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				} else {
					client.commit();
					oResponse.status(201).send("Record created successfully!");
				}
				callback(null, results);
			}
		], function (err, result) {
			console.log(err);
		});
	},

	createNewRecord: function (oRequest, oResponse) {
		let oQuery = oRequest.query;
		let sGetUsername =
			"SELECT DISTINCT VALUE FROM \"PUBLIC\".\"M_SESSION_CONTEXT\" WHERE KEY='APPLICATIONUSER'";

		//grab all the body payload, all parameters as folow. 
		//CHANGE_DATATYPE
		//DATA_INPUT
		//DATA_SET_TYPE
		//FILE_RECEIVED_DATE
		//FREQUENCY
		//FROM_DATE
		//HAS_LOADED_IN_EDW
		//META_FILE_NAME
		//PERIOD_KEY
		//RAF_FILE_NAME
		//ROW_COUNTS
		//SOURCE
		//SOURCE_FIELD_VALUE
		//TABLE_NAME
		//TIMESTAMP
		//TO_DATE
		//YEAR_TYPE

		let oPayload = oRequest.body;

		let client = oRequest.db;
		client.setAutoCommit(false);
		const oController = this;
		async.waterfall([

			function getUsername(callback) {
				client.prepare(
					sGetUsername,
					function (err, statement) {
						callback(null, err, statement);
					});
			},

			function executeGetUsername(err, statement, callback) {

				if (err) {
					client.rollback();
					oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				} else {
					statement.exec([], function (execErr, results) {
						callback(null, execErr, results);
					});
				}

			},

			function prepareInsertionRecord(execErr, results, callback) {

				let oFinalPayload = oController.sanitisePayload(oRequest.body);

				let sInsertToMetadata = "INSERT INTO \"osr.edw.source.data.info.db.data::DATA_INFO.METADATA\"  " +
					"(METADATA_ID, SOURCE, TIMESTAMP, CREATED_AT, CREATED_BY, FREQUENCY, ROW_COUNTS, YEAR_TYPE, DATA_SET_TYPE," +
					"META_FILE_NAME, TYPE, RAF_TABLE_NAME, SOURCE_FIELD_VALUE, EDW_FILE_NAME, FROM_DATE, TO_DATE," +
					"ERRORS, RAF_FILE_NAME, HAS_LOADED_IN_EDW, CHANGE_DATATYPE, FILE_RECEIVED_DATE)" +

					"VALUES(SYSUUID,'" + oFinalPayload.SOURCE + "',CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '" + results[0].VALUE.toUpperCase() + "', '" +
					oFinalPayload.FREQUENCY + "'," +
					" '" + oFinalPayload.ROW_COUNTS + "', '" + oFinalPayload.YEAR_TYPE + "', " +
					" '" + oFinalPayload.DATA_SET_TYPE + "', '" + oFinalPayload.META_FILE_NAME + "', 'TYPE', 'RAF_TABLE_NAME', '" + oFinalPayload.SOURCE_FIELD_VALUE +
					"'," +
					" '" + oFinalPayload.META_FILE_NAME + "', '" + oFinalPayload.FROM_DATE + "', '" + oFinalPayload.TO_DATE + "', " +
					" '" + oFinalPayload.ERRORS +"', '" + oFinalPayload.RAF_FILE_NAME + "', '" + oFinalPayload.HAS_LOADED_IN_EDW + "', '" + oFinalPayload.CHANGE_DATATYPE +
					"', '" + oFinalPayload.FILE_RECEIVED_DATE + "')";

				client.prepare(
					sInsertToMetadata,
					function (err, statement) {
						callback(null, err, statement);
					});
			},

			function executeInsert(err, statement, callback) {

				if (err) {
					client.rollback();
					oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				} else {
					statement.exec([], function (execErr, results) {
						callback(null, execErr, results);
					});
				}

			},

			function finalResponse(err, results, callback) {
				if (err) {
					client.rollback();
					oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				} else {
					client.commit();
					oResponse.status(201).send("Record created successfully!");
				}
				callback(null, results);
			}
		], function (err, result) {
			console.log(err);
		});
	},

	sanitisePayload: function (oPayload) {

		let oFinalPayload = {};

		if (oPayload.__metadata) {
			delete oPayload.__metadata;
		}

		//convert everything to uppercase. 
		for (let sProperty in oPayload) {
			if (oPayload.hasOwnProperty(sProperty)) {

				oFinalPayload[sProperty] = oPayload[sProperty].toUpperCase();

				if (sProperty === "HAS_LOADED_IN_EDW") {
					if (oPayload[sProperty] === "true") {
						oFinalPayload[sProperty] = 'Y';
					} else {
						oFinalPayload[sProperty] = 'N';
					}
				}

			}
		}
		return oFinalPayload;
	},

	updateMetadataRecord: function (oRequest, oResponse) {

		//get current record 
		//create a new record 
		this.createNewRecord(oRequest, oResponse);

	},

	/**
	 * Grab current contact details of a particular org for current tab
	 * @param  {[type]} oRequest  [description]
	 * @param  {[type]} oResponse [description]
	 * @return {[type]}           [description]
	 */
	getMetadata: function (oRequest, oResponse) {
		let oQuery = oRequest.query;
		let sFinalSearchString =
			"SELECT TO_VARCHAR(METADATA_ID) AS METADATA_ID,CREATED_AT,CREATED_BY,META_FILE_NAME,TIMESTAMP,SOURCE,TYPE, " +
			"RAF_TABLE_NAME,RAF_FILE_NAME,SOURCE_FIELD_VALUE," +
			"EDW_FILE_NAME,FREQUENCY,ROW_COUNTS,YEAR_TYPE,FILE_RECEIVED,FROM_DATE,TO_DATE,ERRORS," +
			"DATA_SET_TYPE " +
			"FROM \"osr.edw.source.data.info.db.data::DATA_INFO.METADATA\" ";

		let client = oRequest.db;
		let oController = this;
		async.waterfall([

			function prepare(callback) {
				client.prepare(
					sFinalSearchString,
					function (err, statement) {
						callback(null, err, statement);
					});
			},

			function execute(err, statement, callback) {
				statement.exec([], function (execErr, results) {
					callback(null, execErr, results);
				});
			},
			function response(err, results, callback) {
				if (err) {
					oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				} else {
					let result = JSON.stringify({
						Total: results.length,
						Results: results
					});
					oResponse.type("application/json").status(200).send(result);
				}
				callback(null, results);
			}
		], function (err, result) {
			console.log(err);
		});

	}

};