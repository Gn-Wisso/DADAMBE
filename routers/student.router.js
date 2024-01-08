const express = require("express");
const routeStudent = express.Router();
var bodyParser = require("body-parser");
const { response } = require("express");
var jsonParser = bodyParser.json();
const studentControler = require("../controlors/student.controler");

routeStudent.post("/addStudent", jsonParser, studentControler.addStudent);
routeStudent.put("/modify/:id", jsonParser, studentControler.updateStudent);
routeStudent.delete("/remove/:id", jsonParser, studentControler.removeStudent);
routeStudent.get("/list", jsonParser, studentControler.listStudents);
routeStudent.get("/find", jsonParser, studentControler.ExploreSearch);
routeStudent.post("/getStudentHistory", jsonParser, studentControler.getStudentHistory);
routeStudent.post("/getStudent", jsonParser, studentControler.getStudentData);

module.exports = routeStudent;