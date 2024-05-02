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
    const {
      date,
      startAt,
      endAt,
      isSessionInClass,
      defaultPrice,
      students,
      teachers,
      comments,
    } = req.body.data;
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

    const newPrivateSession = await db.privateSession.create({
      dayCode: new Date(`${date} ${startAt}`).getDay(),
      date: date,
      startAt: startAt,
      endAt: endAt,
      classID: isSessionInClass ? result[0].id : null,
      lib: comments,
      prix: defaultPrice,
    });
    // Add associations (students and teachers)

    await newPrivateSession.addStudents(students.map((student) => student));
    await newPrivateSession.addTeachers(teachers.map((teacher) => teacher));

    return res.send({
      message: "Private Session added successfully",
      code: 200,
    });
  } catch (error) {
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
    const {
      eventID,
      date,
      startAt,
      endAt,
      isSessionInClass,
      students,
      teachers,
      comments,
      defaultPrice,
    } = req.body.data;

    // Find if there are any available classes in this date and time
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
        message: "Error, No Available Classes",
        code: 401,
      });
    }

    // Retrieve the existing private session
    const existingPrivateSession = await db.privateSession.findByPk(eventID);

    if (!existingPrivateSession) {
      return res.send({
        message: "Private Session not found",
        code: 404,
      });
    }

    // Update the session details
    await db.privateSession.update(
      {
        dayCode: new Date(`${date} ${startAt}`).getDay(),
        date: date,
        startAt: startAt,
        endAt: endAt,
        classID: isSessionInClass ? result[0].id : null,
        lib: comments,
        prix: defaultPrice,
      },
      {
        where: {
          ID_ROWID: eventID,
        },
      }
    );

    // Remove existing associations for students and teachers
    await existingPrivateSession.removeStudents(
      await existingPrivateSession.getStudents()
    );
    await existingPrivateSession.removeTeachers(
      await existingPrivateSession.getTeachers()
    );

    // Add new associations for students and teachers
    await existingPrivateSession.addStudents(
      students.map((student) => student)
    );
    await existingPrivateSession.addTeachers(
      teachers.map((teacher) => teacher)
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
const deleteSession = async (req, res, next) => {
  try {
    const { idSession } = req.body;
    await db.privateSession.destroy({
      where: { ID_ROWID: idSession },
    });
    return res.send({
      message: "private Session deleted successfully",
      code: 200,
    });
  } catch (error) {
    return res.send({
      message: "Error deleting the session",
      code: 500,
      error: error.message,
    });
  }
};
// get private session attendance recording

const getPrivateSessionAttendanceRecording = async (req, res, next) => {
  try {
    const { id } = req.params; // session id
    // Check if the necessary data (title) is provided
    if (!id) {
      return res.send({
        message: "Error! id is required.",
        code: 409,
      });
    }
    const privateSession = await db.privateSession.findByPk(id, {
      include: [
        {
          model: db.student,
          as: "students",
          include: [
            {
              model: db.person,
              as: "personProfile2",
              attributes: ["firstName", "lastName", "dateOfBirth"],
            },
          ],
          attributes: ["ID_ROWID"],
          through: { attributes: ["isAttended"] }, // Exclude association attributes
        },
        {
          model: db.teacher,
          as: "teachers",
          include: [
            {
              model: db.person,
              as: "personProfile2",
              attributes: ["firstName", "lastName", "dateOfBirth"],
            },
          ],
          attributes: ["ID_ROWID"],
          through: { attributes: ["isAttended"] }, // Exclude association attributes
        },
      ],
    });
    return res.send({
      message: `Session Attendance Recording is fetch successfully.`,
      teacherList: privateSession?.teachers,
      studentList: privateSession?.students,
      code: 200,
    });
  } catch (error) {
    res.send({
      message:
        "An error occurred while fetching the Session Attendance Recording.",
      error: error.message,
      code: 400,
    });
    console.log(error);
  }
};

const updatePrivateSessionAttendanceRecording = async (req, res, next) => {
  try {
    const { studentList, teacherList, id } = req.body.data;
    // set all student to isAttended: false
    await db.studentsInPrivateSession.update(
      {
        isAttended: false,
      },
      {
        where: {
          privateSessionID: id,
        },
      }
    );

    studentList.map(async (student) => {
      // set selected student to isAttended: true
      await db.studentsInPrivateSession.update(
        {
          isAttended: true,
        },
        {
          where: {
            privateSessionID: id,
            studentID: student.id,
          },
        }
      );
    });

    /** teacher part  */
    // set all teachers to isAttended: false
    await db.teachersInPrivateSession.update(
      {
        isAttended: false,
      },
      {
        where: {
          privateSessionID: id,
        },
      }
    );
    teacherList.map(async (teacher) => {
      // set selected teachers to isAttended: true
      await db.teachersInPrivateSession.update(
        {
          isAttended: true,
        },
        {
          where: {
            privateSessionID: id,
            teacherID: teacher.id,
          },
        }
      );
    });

    // update private session
    await db.privateSession.update(
      {
        isAchieved: true,
      },
      {
        where: {
          ID_ROWID: id,
        },
      }
    );
    return res.send({
      message: `Session Attendance Recording is updated successfully.`,
      code: 200,
    });
  } catch (error) {
    res.send({
      message:
        "An error occurred while updated the Session Attendance Recording.",
      error: error.message,
      code: 400,
    });
    console.log(error);
  }
};
module.exports = {
  addSession,
  updateSession,
  deleteSession,
  getPrivateSessionAttendanceRecording,
  updatePrivateSessionAttendanceRecording,
};
