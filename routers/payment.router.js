const express = require("express");
const routePayment = express.Router();
var bodyParser = require("body-parser");
const paymentController = require("../controlors/payment.controler");
var jsonParser = bodyParser.json();

// Route for adding a new payment
routePayment.post("/add", jsonParser, paymentController.addPayment);

// Route for deleting a payment
routePayment.delete("/remove/:id", jsonParser, paymentController.removePayment);

// Route for listing all payments
routePayment.get("/list", jsonParser, paymentController.listPayments);

// Route for getting students for a specific program's payments
routePayment.get("/studentforprogram/:id", jsonParser, paymentController.getStudentsForProgramPayments)
routePayment.get("/stats/:id", jsonParser, paymentController.getTotalPaymentsForProgram);


module.exports = routePayment;
