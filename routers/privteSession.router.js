const express = require("express");
const routeSessionPrivate = express.Router();
var bodyParser = require("body-parser");
const sessionPrivateController = require("../controlors/privateSession.controler.js");
var jsonParser = bodyParser.json();
// Route for adding a new category
routeSessionPrivate.put(
  "/addPrivateSession",
  jsonParser,
  sessionPrivateController.addSession
);
routeSessionPrivate.put(
  "/updatePrivateSession",
  jsonParser,
  sessionPrivateController.updateSession
);
routeSessionPrivate.post(
  "/deletePrivateSession",
  jsonParser,
  sessionPrivateController.deleteSession
);
routeSessionPrivate.get(
  "/getPrivateSessionAttendanceRecording/:id",
  jsonParser,
  sessionPrivateController.getPrivateSessionAttendanceRecording
);
routeSessionPrivate.put(
  "/updatePrivateSessionAttendanceRecording/:id",
  jsonParser,
  sessionPrivateController.updatePrivateSessionAttendanceRecording
);
module.exports = routeSessionPrivate;
