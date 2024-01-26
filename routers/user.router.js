const express = require("express");
const userRouter = express.Router();
var bodyParser = require("body-parser");
const { response } = require("express");
var jsonParser = bodyParser.json();
const userControler = require("../controlors/user.controller");

userRouter.post("/addUser", jsonParser, userControler.addUser);
userRouter.post("/getUserPosition", jsonParser, userControler.getUserPosition);
userRouter.get("/getAllUsers", jsonParser, userControler.getAllUsers);
userRouter.delete("/removeUser/:id", jsonParser, userControler.removeUser);
userRouter.get("/ExploreSearchUsers/:key", jsonParser, userControler.ExploreSearchUsers);

// user profile
userRouter.get("/getUserProfile/:id", jsonParser, userControler.getUserProfile);
userRouter.put("/updateGeneralUserData", jsonParser, userControler.updateGeneralUserData);
userRouter.put("/updatePasword", jsonParser, userControler.updatePassword);



module.exports = userRouter;