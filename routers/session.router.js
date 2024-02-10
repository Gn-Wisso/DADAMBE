const express = require("express");
const routeSession = express.Router();
var bodyParser = require("body-parser");
const sessionController = require("../controlors/session.controler.js");
var jsonParser = bodyParser.json();
// Route for adding a new category
routeSession.post("/getAvailableData", jsonParser, sessionController.getAvailableData);
routeSession.post("/addSessions", jsonParser, sessionController.addSessions);
routeSession.post("/getAllSessionsInProg", jsonParser, sessionController.getAllSessionsInProg);
routeSession.post("/deleteSession", jsonParser, sessionController.deleteSession);
routeSession.post("/getAllSessionsForSalle", jsonParser, sessionController.getAllSessionsForSalle);
routeSession.post("/getAllSessions", jsonParser, sessionController.getAllSessions);
routeSession.post("/getAllSessionsForStudent", jsonParser, sessionController.getAllSessionsForStudent);
routeSession.post("/getAllSessionsForTeacher", jsonParser, sessionController.getAllSessionsForTeacher);

routeSession.post("/updateSession", jsonParser, sessionController.updateSession);

module.exports = routeSession;