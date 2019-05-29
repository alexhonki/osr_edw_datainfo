/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
const express = require("express");
const async = require("async");
const metadataHelper = require("./metadataHelper");

module.exports = function () {
	let app = express.Router();

	//root entry path for placeholder
	app.get("/", function (req, res) {
		res.send("Instantiation of Services search");
	});

	//blank entry points to get csrf token to allow
	//other http methods to be executed.
	app.get("/getToken", function (req, res) {
		res.send("Token sent!");
	});

	//get sources for the dropdown
	app.get("/getSources", function (req, res) {

		metadataHelper.getSources(req, res);

	});

	//for execution of search
	app.get("/getMetadata", function (req, res) {

		metadataHelper.getMetadata(req, res);

	});


	//for creation of a new source entry
	app.post("/createNewSource", function (req, res) {

		metadataHelper.createNewSource(req, res);

	});

	//for creation of a new record base on a entry
	app.post("/createNewRecord", function (req, res) {

		metadataHelper.createNewRecord(req, res);

	});

	//for checking whether a particular record is unique
	//or not.
	app.post("/checkUniqueness", function (req, res) {

		metadataHelper.checkUniqueness(req, res);

	});


	//for creation of a new record base on a entry
	app.put("/updateMetadataRecord", function (req, res) {

		metadataHelper.updateMetadataRecord(req, res);

	});


	return app;
};
