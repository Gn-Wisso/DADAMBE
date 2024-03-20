const db = require(".././models");
const seq = require("sequelize");
require("dotenv").config();
const Op = seq.Op;
const moment = require("moment");

async function getAvailableClass(
  date,
  timeStart,
  timeFinish,
  classes,
  eventID
) {
  const start = new Date(`1970-01-01T${timeStart}`);
  const end = new Date(`1970-01-01T${timeFinish}`);

  // Retrieve sessions within the specified date
  const sessions = await db.session.findAll({
    where: {
      date: date,
      ID_ROWID: { [Op.ne]: eventID },
    },
  });

  // Retrieve private sessions within the specified date
  const privateSessions = await db.privateSession.findAll({
    where: {
      date: date,
      ID_ROWID: { [Op.ne]: eventID },
    },
  });

  // Map reserved classes based on time range from sessions and private sessions
  const reservedClasses = sessions
    .concat(privateSessions)
    .filter((session) => {
      const sTStart = new Date(`1970-01-01T${session.startAt}`);
      const eTStart = new Date(`1970-01-01T${session.endAt}`);
      return start < eTStart && end > sTStart;
    })
    .map((session) => session.classID);

  // Find classes that are not reserved during the specified time range
  const inReservedClasses = classes
    .filter((classe) => !reservedClasses.includes(classe.ID_ROWID))
    .map((classe) => ({ id: classe.ID_ROWID, name: classe.className }));

  return inReservedClasses;
}

// private session
const addSession = async (req, res, next) => {
  try {
    const { date, startAt, endAt, isSessionInClass } = req.body.data;
    // find if ther is any available classes in this date and time
    // get all classes

    const classes = await db.class.findAll({
      attributes: ["ID_ROWID", "className"],
    });
    const result = await getAvailableClass(date, startAt, endAt, classes, null);
    if (isSessionInClass && result.length === 0) {
      return res.send({
        message: "Error creating the session",
        code: 401,
      });
    }

    await db.privateSession.create({
      dayCode: new Date(`${date} ${startAt}`).getDay(),
      date: date,
      startAt: startAt,
      endAt: endAt,
      classID: isSessionInClass ? result[0].id : null,
    });
    return res.send({
      message: "Private Session added successfully",
      code: 200,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      message: "Error adding the session",
      code: 500,
      error: error.message,
    });
  }
};
// private session
const updateSession = async (req, res, next) => {
  try {
    const { eventID, date, startAt, endAt, isSessionInClass } = req.body.data;
    // find if ther is any available classes in this date and time
    // get all classes

    const classes = await db.class.findAll({
      attributes: ["ID_ROWID", "className"],
    });
    const result = await getAvailableClass(
      date,
      startAt,
      endAt,
      classes,
      eventID
    );
    if (isSessionInClass && result.length === 0) {
      return res.send({
        message: "Error creating the session",
        code: 401,
      });
    }

    await db.privateSession.update(
      {
        dayCode: new Date(`${date} ${startAt}`).getDay(),
        date: date,
        startAt: startAt,
        endAt: endAt,
        classID: isSessionInClass ? result[0].id : null,
      },
      {
        where: { ID_ROWID: eventID },
      }
    );
    return res.send({
      message: "Private Session updated successfully",
      code: 200,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      message: "Error updating the session",
      code: 500,
      error: error.message,
    });
  }
};

module.exports = {
  addSession,
  updateSession,
};
