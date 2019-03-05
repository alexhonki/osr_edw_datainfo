/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
const express = require("express");
const async = require("async");
const searchHelper = require("./searchHelper");

module.exports = function() {
	let app = express.Router();

	//root entry path for placeholder
	app.get("/", function(req, res) {
		res.send("Instantiation of Services search");
	});

	//for execution of search
	app.get("/execute", function(req, res) {

		searchHelper.executeSearch(req, res);

	});

	// //get latest contact information base on specific
	// //sort arrangement as per PPT of Explorer Org.
	// app.get("/getContact", function(req, res) {
	//
	// 	searchHelper.getContact(req, res);
	//
	// });
	//
	// //to get the different list of ACN and ABR
	// app.get("/helper", function(req, res) {
	//
	// 	searchHelper.executeHelper(req, res);
	//
	// });

	return app;
};
