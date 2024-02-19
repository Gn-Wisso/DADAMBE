const express = require("express");
const routeStudentPayment = express.Router();
var bodyParser = require("body-parser");
const studentPaimentController = require("../controlors/studentPaiment.controler.js");
var jsonParser = bodyParser.json();
// Route for adding a new category
routeStudentPayment.get(
  "/getStudentBills/:id",
  jsonParser,
  studentPaimentController.getStudentBills
);
routeStudentPayment.get(
  "/getUnpaidBills/:id",
  jsonParser,
  studentPaimentController.getUnpaidBills
);
module.exports = routeStudentPayment;
