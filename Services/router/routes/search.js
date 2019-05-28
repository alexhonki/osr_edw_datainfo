/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
const express = require("express");
const async = require("async");
const searchHelper = require("./searchHelper");

module.exports = function () {
	let app = express.Router();

	//root entry path for placeholder
	app.get("/", function (req, res) {
		res.send("Instantiation of Services search");
	});

	app.get("/getToken", function (req, res) {
		res.send("Token sent!");
	});
	
	//for execution of search
	app.get("/execute", function (req, res) {

		searchHelper.executeSearch(req, res);

	});

	//for execution of search
	app.get("/getSources", function (req, res) {

		searchHelper.getSources(req, res);

	});

	//for execution of search
	app.get("/getMetadata", function (req, res) {

		searchHelper.getMetadata(req, res);

	});
	
	
	//for creation of a new source entry
	app.post("/createNewSource", function (req, res) {

		searchHelper.createNewSource(req, res);

	});
	
	//for creation of a new record base on a entry
	app.post("/createNewRecord", function (req, res) {

		searchHelper.createNewRecord(req, res);

	});
	
	//for checking whether a particular record is unique
	//or not. 
	app.post("/checkUniqueness", function (req, res) {

		searchHelper.checkUniqueness(req, res);

	});
	
	
	//for creation of a new record base on a entry
	app.put("/updateMetadataRecord", function (req, res) {

		searchHelper.updateMetadataRecord(req, res);

	});
	

	return app;
};