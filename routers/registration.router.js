const express = require("express");
const routeRegistration = express.Router();
var bodyParser = require("body-parser");
const registrationController = require("../controlors/registration.controler");
var jsonParser = bodyParser.json();
// Route for adding a new registration
routeRegistration.post("/add", jsonParser, registrationController.addRegistration);
// Route for deleting a registration
routeRegistration.delete("/remove/:id", jsonParser, registrationController.removeRegistration);
routeRegistration.get("/list", jsonParser, registrationController.listRegistrations);
// Programme Regestraions part
routeRegistration.post("/programmeListRegestarion", jsonParser, registrationController.listProgrammeRegistrations);
routeRegistration.post("/updateRegistrationGroup", jsonParser, registrationController.updateRegistrationGroup);
routeRegistration.post("/affectation", jsonParser, registrationController.affectation);

module.exports = routeRegistration;