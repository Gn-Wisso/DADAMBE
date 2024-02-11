const db = require("../models");
const seq = require("sequelize");
const Op = seq.Op;
require("dotenv").config();

const getSessionAttendanceRecording = async (req, res, next) => {
  try {
    const { id } = req.params; // session id
    // Check if the necessary data (title) is provided
    if (!id) {
      return res.send({
        message: "Error! id is required.",
        code: 409,
      });
    }

    // get student Attendance Recording
    const studentAttResList = await db.studentAttendanceRecording({
      where: {
        sessionID: id,
      },
    });
    // get teacher Attendance Recording
    const teacherAttResList = await db.teacherAttendanceRecording({
      where: {
        sessionID: id,
      },
    });

    // get groupe id
    const session = await db.session.findByPk(id, {
      include: {
        model: db.groupe,
        attributes: ["ID_ROWID"],
        include: [
          {
            model: db.student,
            attributes: ["ID_ROWID"],
            required: false,
            include: {
              model: db.person,
              as: "personProfile2", // Alias you set in associations
              attributes: ["firstName", "lastName"], // specify the attributes you want
            },
          },
          {
            model: db.teacher,
            attributes: ["ID_ROWID"],
            required: false,
            include: {
              model: db.person,
              as: "personProfile2", // Alias you set in associations
              attributes: ["firstName", "lastName"], // specify the attributes you want
            },
          },
        ],
      },
    });

    // get groupe teacher list
    return res.send({
      message: `Session Attendance Recording is fetch successfully.`,
      teacherList: session?.groupe.teachers,
      teacherAttResList,
      studentList: session?.groupe.students,
      studentAttResList,
      code: 200,
    });
  } catch (error) {
    return res.send({
      message:
        "An error occurred while fetching the Session Attendance Recording.",
      error: error.message,
      code: 400,
    });
  }
};

const updateSessionAttendanceRecording = async (req, res, next) => {
  try {
    const { id } = req.params.id; // session id
    const { studentList, teacherList, nbrStudent, isAchieved, idProg } =
      req.body;
    // Check if the necessary data (title) is provided
    if (!id) {
      return res.send({
        message: "Error! id is required.",
        code: 409,
      });
    }
    // get program type of paiment
    const prog = await db.program.findByPk(idProg, {
      attributes: ["typeOfPaiment"],
    });

    // delete all Attendance Recording For Student
    await db.studentAttendanceRecording.destroy({
      where: {
        sessionID: id,
      },
    });
    // create new Attendance Recording For Student
    studentList.forEach(async (student) => {
      if (prog && prog.typeOfPaiment == "total") {
        // find if there is student already pay for this program in total mode
        const listPaymeniInTotalMode = await db.paymentTotalMode.findAll({
          where: {
            progID: idProg,
          },
          include: {
            model: db.bill,
            where: {
              studentID: student.id,
            },
          },
        });
        await db.studentAttendanceRecording.create({
          studentID: student.id,
          sessionID: id,
          isPaid:
            listPaymeniInTotalMode && listPaymeniInTotalMode.lenght != 0
              ? true
              : false,
        });
      } else {
        await db.studentAttendanceRecording.create({
          studentID: student.id,
          sessionID: id,
        });
      }
    });
    /** teacher part  */
    // delete all Attendance Recording For Student
    await db.teacherAttendanceRecording.destroy({
      where: {
        sessionID: id,
      },
    });
    // create new Attendance Recording For Student
    teacherList.forEach(async (teacher) => {
      await db.teacherAttendanceRecording.create({
        teacherID: teacher.id,
        sessionID: id,
        NumberOfAttendees: nbrStudent,
      });
    });
    // update session
    await db.session.update({
      isAchieved: isAchieved,
    });
    return res.send({
      message: `Session Attendance Recording is updated successfully.`,
      code: 200,
    });
  } catch (error) {
    return res.send({
      message:
        "An error occurred while updated the Session Attendance Recording.",
      error: error.message,
      code: 400,
    });
  }
};

module.exports = {
  getSessionAttendanceRecording,
  updateSessionAttendanceRecording,
};
