const express = require("express");
const routeSessionAttRec = express.Router();
var bodyParser = require("body-parser");
const sessionAttRecController = require("../controlors/sessionAttendanceRecording.controler.js");
var jsonParser = bodyParser.json();
// Route for adding a new category
routeSessionAttRec.get(
  "/getSessionAttendanceRecording/:id",
  jsonParser,
  sessionAttRecController.getSessionAttendanceRecording
);
routeSessionAttRec.put(
  "/updateSessionAttendanceRecording/:id",
  jsonParser,
  sessionAttRecController.updateSessionAttendanceRecording
);
routeSessionAttRec.get(
  "/getSessionAttendanceRecordingForStuent/:id",
  jsonParser,
  sessionAttRecController.getSessionAttendanceRecordingForStuent
);
module.exports = routeSessionAttRec;
