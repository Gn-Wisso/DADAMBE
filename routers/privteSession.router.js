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
module.exports = routeSessionPrivate;
