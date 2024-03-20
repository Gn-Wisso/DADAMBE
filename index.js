const express = require("express");
const app = express();
const db = require("./models");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const studentRouter = require("./routers/student.router"); // Adjusted path to the routerapp.use(cors());
const teacherRouter = require("./routers/teacher.router");
const programRouter = require("./routers/programe.router");
const regisrationRouter = require("./routers/registration.router");
const paymentRouter = require("./routers/payment.router");
const classRouter = require("./routers/class.router");
const categorieRouter = require("./routers/categorie.router");
const groupeRouter = require("./routers/groupe.router");
const GSRouter = require("./routers/studentgroupe.router");
const connexionRouter = require("./routers/connexion.router");
const userRouter = require("./routers/user.router");
const schoolRouter = require("./routers/school.router");
const sessionRouter = require("./routers/session.router");
const staticRouter = require("./routers/statisticData.router");
const LevelOfStudyRouter = require("./routers/levelOfStudy.router");
const routeSessionAttRec = require("./routers/sessionAttRec.router");
const routeStudentPayment = require("./routers/studentPaiment.router");
const routePrivateSession = require("./routers/privteSession.router");

const webSiteRouter = require("./routers/webSite.router");
const middleware = require("./middleware/connexionVerification");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ strict: false, limit: "15mb" }));

app.use(function (req, res, next) {
  req.headers["content-type"] = "application/json";
  next();
});
app.get("/DADAM_Backend", (req, res) => {
  res.send({ message: "Hello from server!" });
});

app.use("/DADAM_Backend/protected/*", middleware.verifyUserTokenExpiration);
app.use("/DADAM_Backend/connexion", connexionRouter);
app.use("/DADAM_Backend/webSite", webSiteRouter);
app.use("/DADAM_Backend/protected/students", studentRouter);
app.use("/DADAM_Backend/protected/teachers", teacherRouter);
app.use("/DADAM_Backend/protected/program", programRouter);
app.use("/DADAM_Backend/protected/registration", regisrationRouter);
app.use("/DADAM_Backend/protected/payment", paymentRouter);
app.use("/DADAM_Backend/protected/class", classRouter);
app.use("/DADAM_Backend/protected/categorie", categorieRouter);
app.use("/DADAM_Backend/protected/groupe", groupeRouter);
app.use("/DADAM_Backend/protected/gs", GSRouter);
app.use("/DADAM_Backend/protected/user", userRouter);
app.use("/DADAM_Backend/protected/school", schoolRouter);
app.use("/DADAM_Backend/protected/session", sessionRouter);
app.use("/DADAM_Backend/protected/static", staticRouter);
app.use("/DADAM_Backend/protected/educationLevel", LevelOfStudyRouter);
app.use("/DADAM_Backend/protected/sessionAttRec", routeSessionAttRec);
app.use("/DADAM_Backend/protected/Bills", routeStudentPayment);
app.use("/DADAM_Backend/protected/privateSession", routePrivateSession);
// Function to create initial user if no users exist
const createInitialUser = async () => {
  try {
    const count = await db.user.count();

    if (count === 0) {
      const person = await db.person.create({
        firstName: "admin",
        lastName: "admin",
        mail: "admin@gmail.com",
        imagePath: null,
        phoneNumber: "+213666666666",
        dateOfBirth: 2023 - 12 - 31,
      });
      // Create a user
      // hash the password
      const hashedPassword = await bcrypt.hash("adminDadam2024", 10);
      // create the user
      await db.user.create({
        UserName: "admin",
        role: "Admin",
        Password: hashedPassword,
        personId: person.ID_ROWID,
      });
    }
  } catch (error) {
    console.error("Error creating initial user:", error);
  }
};
db.sequelize.sync().then(() => {
  const PORT = process.env.PORT || 8323;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
  return createInitialUser();
});
