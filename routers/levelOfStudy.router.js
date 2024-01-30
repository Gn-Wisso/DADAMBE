const express = require("express");
const routeLevelOfStudy = express.Router();
var bodyParser = require("body-parser");
const { response } = require("express");
var jsonParser = bodyParser.json();
const levelOfStudyControler = require("../controlors/levelOfStudy.controler");
// add 
routeLevelOfStudy.post("/addEducationLevel", jsonParser, levelOfStudyControler.addEducationLevel);
routeLevelOfStudy.post("/addStudyYear", jsonParser, levelOfStudyControler.addStudyYear);
// update
routeLevelOfStudy.put("/updateEducationLevel", jsonParser, levelOfStudyControler.updateEducationLevel);
routeLevelOfStudy.put("/updateStudyYear", jsonParser, levelOfStudyControler.updateStudyYear);
// delete
routeLevelOfStudy.delete("/removeLevelEduc/:id", jsonParser, levelOfStudyControler.deleteEducationLevel);
routeLevelOfStudy.delete("/removeYearEduc/:id", jsonParser, levelOfStudyControler.deleteStudyYear);
//futch all 
routeLevelOfStudy.get("/listLevelWYearEduc", jsonParser, levelOfStudyControler.allEducLevelWStudyYear);

module.exports = routeLevelOfStudy;