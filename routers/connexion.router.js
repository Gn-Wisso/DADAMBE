const express = require("express");
const connexionRouter = express.Router();
var bodyParser = require("body-parser");
const { response } = require("express");
var jsonParser = bodyParser.json();
const connexionControler = require("../controlors/connexion.controler");
const connexionControler2 = require("../controlors/connexionTeacher.controler");

connexionRouter.post("/userLogIn", jsonParser, connexionControler.login);
connexionRouter.post("/userLogInEns", jsonParser, connexionControler2.login);

module.exports = connexionRouter;
