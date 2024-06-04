const express = require("express");
const routeTeacherPayment = express.Router();
var bodyParser = require("body-parser");
const teacherPaimentController = require("../controlors/teacherPaiment.controler.js");
var jsonParser = bodyParser.json();
// Route for adding a new category
routeTeacherPayment.get(
  "/getTeacherSalaire/:id",
  jsonParser,
  teacherPaimentController.getTeacherSalaires
);
routeTeacherPayment.get(
  "/getUnpaidSailare/:id",
  jsonParser,
  teacherPaimentController.getUnpaidSalaire
);
routeTeacherPayment.post(
  "/payTeacherSalaire",
  jsonParser,
  teacherPaimentController.payTeacherSalaire
);
module.exports = routeTeacherPayment;
