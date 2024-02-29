const db = require("../models");
const seq = require("sequelize");
const op = seq.Op;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
// Generate a new API token
function generateToken(userName, id) {
  const expirationTime = Math.floor(Date.now() / 1000) + 864000; // 10 days in seconds
  const payload = {
    userId: id,
    userMail: userName,
    exp: expirationTime,
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    algorithm: "HS256",
  });
  return token;
}

// login
const login = async (req, res, next) => {
  const { userLog, psw } =
    req.body; /* userLog is the field that can passe an email or a username
                                        psw id the field that passe the password of the account */
  // Check if userLog and password is provided
  if (!userLog || !psw) {
    return res.send({
      message: "user mail or Password not present",
      error: "userLog or Password not present",
      code: 401,
    });
  } else {
    try {
      /**
       * find the user that has the userLog in one of the email or the username
       */
      let teacher = await db.teacher.findOne({
        where: {
          "$personProfile2.mail$": userLog,
        },
        include: [
          {
            model: db.person,
            as: "personProfile2",
          },
        ],
      });
      if (!teacher) {
        // The most commonly used status code for login failed is 401 Unauthorized
        return res.send({
          message:
            "Nous n'avons trouvé aucun utilisateur associé à cette adresse e-mail.",
          error: "User password or log in is not correct",
          code: 401,
        });
      }
      // find if the password is correct
      const passwordMatch = await bcrypt.compare(psw, teacher.Password);

      if (!passwordMatch) {
        return res.send({
          message: "Le mot de passe que vous avez saisi est incorrect.",
          error: "password incorrect",
          code: 401,
        });
      } else {
        const token = generateToken(teacher.ID_ROWID, teacher.username);
        teacher.isConnected = true;
        teacher.LastcnxDate = Date.now();
        teacher.save();
        return res.send({
          message: "Login successfully",
          token: token,
          userID: teacher.ID_ROWID,
          code: 200,
        });
      }
    } catch (error) {
      res.send({
        message: "An error occurred",
        error: error.message,
        code: 400,
      });
      throw error;
    }
  }
};
// logout
const logOut = async (req, res, next) => {
  const { userID } =
    req.body; /* userLog is the field that can passe an email or a username
                                        psw id the field that passe the password of the account */
  // Check if userLog and password is provided
  if (!userID) {
    return res.send({
      message: "No data send",
      error: "No data send",
      code: 401,
    });
  } else {
    try {
      let teacher = await db.teacher.findOne({
        where: {
          ID_ROWID: userID,
        },
      });
      if (!teacher) {
        // The most commonly used status code for login failed is 401 Unauthorized
        return res.send({
          message: "No data found",
          error: "No data found",
          code: 401,
        });
      }
      teacher.isConnected = false;
      teacher.save();
      return res.send({
        message: "Logout successfully",
        code: 200,
      });
    } catch (error) {
      res.send({
        message: "An error occurred",
        error: error.message,
        code: 400,
      });
      throw error;
    }
  }
};

module.exports = {
  login,
  logOut,
};
