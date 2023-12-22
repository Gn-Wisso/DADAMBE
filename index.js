const express = require("express");
const app = express();
const db = require("./models");
const bodyParser = require("body-parser");
const cors = require("cors");
const studentRouter = require('./routers/student.router'); // Adjusted path to the routerapp.use(cors());
const teacherRouter = require('./routers/teacher.router');
const programRouter = require('./routers/programe.router');
const regisrationRouter = require('./routers/registration.router');
const classRouter = require('./routers/class.router');
const categorieRouter = require('./routers/categorie.router');
const groupeRouter = require('./routers/groupe.router');
const GSRouter = require('./routers/studentgroupe.router');

const connexionRouter = require('./routers/connexion.router');
const userRouter = require('./routers/user.router');
const schoolRouter = require('./routers/school.router');
const sessionRouter = require('./routers/session.router');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ strict: false, limit: "15mb" }));



app.use(function (req, res, next) {
    req.headers["content-type"] = "application/json";
    next();
});
app.get("/DADAM_Backend", (req, res) => {
    res.send({ message: "Hello from server!" });
});


app.use('/DADAM_Backend/students', studentRouter);
app.use('/DADAM_Backend/teachers', teacherRouter);
app.use('/DADAM_Backend/program', programRouter);
app.use('/DADAM_Backend/registration', regisrationRouter);
app.use('/DADAM_Backend/class', classRouter);
app.use('/DADAM_Backend/categorie', categorieRouter);
app.use('/DADAM_Backend/groupe', groupeRouter);
app.use('/DADAM_Backend/gs', GSRouter);
app.use('/DADAM_Backend/connexion', connexionRouter);
app.use('/DADAM_Backend/user', userRouter);
app.use('/DADAM_Backend/school', schoolRouter);
app.use('/DADAM_Backend/session', sessionRouter);
db.sequelize.sync().then(() => {
    const PORT = process.env.PORT || 8323;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
    });
});


