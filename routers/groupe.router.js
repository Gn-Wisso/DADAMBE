const express = require("express");
const routeGroupe = express.Router();
const groupeController = require("../controlors/groupe.controler");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

// Route for adding a new group
routeGroupe.post("/add", jsonParser, groupeController.addGroupe);

// Route for deleting a group
routeGroupe.delete("/remove/:id", groupeController.removeGroupe);
routeGroupe.put("/update/:id", jsonParser, groupeController.updateGroupe);
routeGroupe.post("/listProgrammeGroups", jsonParser, groupeController.listProgrammeGroups);
routeGroupe.post("/listGroups", jsonParser, groupeController.listGroups);

module.exports = routeGroupe;