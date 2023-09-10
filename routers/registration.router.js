const express = require("express");
const routeRegistration = express.Router();
var bodyParser = require("body-parser");
const registrationController = require("../controlors/registration.controler");
var jsonParser = bodyParser.json();
// Route for adding a new registration
routeRegistration.post("/add", jsonParser, registrationController.addRegistration);
// Route for deleting a registration
routeRegistration.delete("/remove/:id", jsonParser, registrationController.removeRegistration);
module.exports = routeRegistration;