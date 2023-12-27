const express = require("express");
const routeStat = express.Router();
var bodyParser = require("body-parser");
const { response } = require("express");
var jsonParser = bodyParser.json();
const statControler = require("../controlors/statistiqueData.controler");

routeStat.post("/getStatistiqueDataForProgProfile", jsonParser, statControler.getStatistiqueDataForProgProfile);
routeStat.post("/getStatistiqueDataForDashbaord1", jsonParser, statControler.getStatistiqueDataForDashbaord1);

module.exports = routeStat;