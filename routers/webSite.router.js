const express = require("express");
const webSiteRouter = express.Router();
var bodyParser = require("body-parser");
const { response } = require("express");
var jsonParser = bodyParser.json();
const webSiteManagement = require("../controlors/webSiteManagement");
const schoolManagment = require("../controlors/school.controler");
// get school data
webSiteRouter.get("/getSchoolData", jsonParser, schoolManagment.getGeneralSchoolData);// program profil

webSiteRouter.get("/getPrincipaleCategories", jsonParser, webSiteManagement.getPrincipaleCategories);
webSiteRouter.get("/getLatestPrograms", jsonParser, webSiteManagement.getLatestPrograms);
//list Category
webSiteRouter.get("/listCategories", jsonParser, webSiteManagement.listCategories);
webSiteRouter.post("/listCategoriesForSpecificOpenMainCategory", jsonParser, webSiteManagement.listCategoriesForSpecificOpenMainCategory);
webSiteRouter.post("/catPath", jsonParser, webSiteManagement.catPath);
// list Program
webSiteRouter.get("/getPrograms", jsonParser, webSiteManagement.getPrograms); // all programs
webSiteRouter.post("/getProgramsForCat", jsonParser, webSiteManagement.getProgramsForCat);// all programs for a specific cat
webSiteRouter.post("/getProgram", jsonParser, webSiteManagement.getProgram);// program profil

module.exports = webSiteRouter;