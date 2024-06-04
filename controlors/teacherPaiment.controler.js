const db = require("../models");
const seq = require("sequelize");
const salaire = require("../models/salaire");
const Op = seq.Op;
require("dotenv").config();

const getTeacherSalaires = async (req, res, next) => {
  try {
    const { id } = req.params; // teacher id
    if (!id) {
      return res.status(409).json({
        message: "Error! id is required.",
        code: 409,
      });
    }
    const data = await db.salaire.findAll({
      where: {
        teacherID: id,
      },
      order: [["ID_ROWID", "DESC"]],
    });

    const salaireData = await Promise.all(
      data.map(async (salaire) => {
        return {
          id: salaire.ID_ROWID,
          totalAmount: salaire.totalAmount,
          date: salaire.createdAt,
        };
      })
    );

    return res.status(200).json({
      message: `Teacher Bills fetched successfully.`,
      salaire: salaireData,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "An error occurred while fetching the Teacher Bills.",
      error: error.message,
      code: 400,
    });
  }
};

// get unpaid bills
const getUnpaidSalaire = async (req, res, next) => {
  try {
    const { id } = req.params; // teacher id
    // Check if the necessary data (title) is provided
    if (!id) {
      return res.send({
        message: "Error! id is required.",
        code: 409,
      });
    }

    const teacherData = await db.teacher.findByPk(id, {
      attributes: ["ID_ROWID"],
      include: [
        {
          model: db.session,
          through: [
            {
              model: db.teacherAttendanceRecording,
              where: {
                isPaid: false,
                teacherID: id,
              },
            },
          ],
          required: false,
          include: [
            {
              model: db.student,
              attributes: ["ID_ROWID"],
              through: {
                model: db.studentAttendanceRecording,
              },
            },

            {
              model: db.groupe,
              attributes: ["ID_ROWID", "GroupeName"],
              include: {
                model: db.program,
                required: false,
              },
            },
          ],
        },
        {
          model: db.privateSession,
          required: false,
          through: [
            {
              model: db.teachersInPrivateSession,
              where: {
                isAttended: true,
                isPaid: false,
                teacherID: id,
              },
            },
          ],
          include: [
            {
              model: db.student, // Include student details
              required: false,
              through: {
                model: db.studentsInPrivateSession,
                required: true,
                where: {
                  isAttended: true,
                },
                required: false,
                attributes: ["ID_ROWID", "isPaid"], // Include specific attributes
              },
            },
          ],
        },
      ],
    });
    const events = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    teacherData?.sessions.forEach((session) => {
      const data = session?.teacherAttendanceRecording;
      if (data.isPaid === false && data.teacherID === Number(id)) {
        // Extract session details
        const { ID_ROWID: sessionId, startAt, endAt, date } = session;
        if (new Date(`${date} ${endAt}`) < currentDate) {
          // Extract class details if available
          const progDetails =
            session.groupe && session.groupe.program
              ? session.groupe.program.title
              : "non défini";
          // Create events based on session data
          events.push({
            id: `normal_${sessionId}`, // Unique identifier for the event
            title: progDetails,
            programID: session.groupe.program.ID_ROWID,
            date: date,
            sortDate: new Date(`${date} ${startAt}`),
            start: startAt,
            end: endAt,
            isPaid: false,
            isChecked: true,
            NumberOfAttendees: session?.students?.length,
            type: "normal",
            // Add other event properties as needed
          });
        }
      }
    });

    teacherData?.privateSessions.forEach((session) => {
      // Extract session details
      const data = session?.teachersInPrivateSession;

      if (data.isPaid === false && data.teacherID === Number(id)) {
        const { ID_ROWID: sessionId, startAt, endAt, date } = session;
        if (new Date(`${date} ${endAt}`) < currentDate) {
          // Create events based on session data
          events.push({
            id: `private_${sessionId}`, // Unique identifier for the event
            date: date,
            sortDate: new Date(`${date} ${startAt}`),
            start: startAt,
            end: endAt,
            isPaid: false,
            isChecked: true,
            NumberOfAttendees: session.students.length || 0,
            type: "private",
            // Add other event properties as needed
          });
        }
      }
    });
    // Group events by program ID

    const groupedEvents = events.reduce((acc, event) => {
      if (event.type === "normal") {
        const { programID, title, type } = event;
        if (!acc[programID]) {
          acc[programID] = {
            id: programID, // id program
            title, // Include program title
            prix: 0,
            type,
            isChecked: true,
            amountByStudent: 0,
            totalAmount: 0,
            quantite: 0,
            events: [],
          };
        }
        acc[programID].events.push(event);
        acc[programID].quantite =
          acc[programID].quantite + event.NumberOfAttendees;
      } else {
        // Handle events of type "private"
        const { id, type } = event;
        if (!acc[id]) {
          acc[id] = {
            id, // id event
            title: "Séance Privé", // Title for private sessions
            prix: 0,
            type,
            isChecked: true,
            amountByStudent: 0,
            totalAmount: 0,
            quantite: 0,
            events: [],
          };
        }
        acc[id].events.push(event);
        acc[id].quantite = acc[id].quantite + event.NumberOfAttendees;
      }
      return acc;
    }, {});
    return res.send({
      message: `Student Bills is fetch successfully.`,
      unpaidSalaire: groupedEvents,
      teacherData,
      code: 200,
    });
  } catch (error) {
    res.send({
      message: "An error occurred while fetching the Student Bills.",
      error: error.message,
      code: 400,
    });
    console.log(error);
  }
};

// student paying bills in multy mode means in session paiment mode or total mode
const payTeacherSalaire = async (req, res, next) => {
  try {
    const { teacherID, paimentRecord, total } = req.body.data; // student id
    const salaire = await db.salaire.create({
      totalAmount: total,
      teacherID: teacherID,
    });
    console.log(
      ".................................//////////////////////////5555555555555"
    );

    for (const key in paimentRecord) {
      const records = paimentRecord[key];
      console.log(records);
      /** create the bills */
      // Creating a new payment record in the database
      if (records.type === "normal" && records.isChecked) {
        for (const event of records.events) {
          /** change the studentAttendanceRecording isPaid field to true */
          if (event.isChecked) {
            const data = await db.teacherAttendanceRecording.update(
              {
                isPaid: true,
                amountByStudent: records.amountByStudent,
                totalAmount: event.NumberOfAttendees * records.amountByStudent,
                NumberOfAttendees: event.NumberOfAttendees,
                salaireID: salaire.ID_ROWID,
              },
              {
                where: {
                  sessionID: event.id
                    .replace("normal_", "")
                    .replace("private_", ""),
                  teacherID: teacherID,
                },
              }
            );
          }
        }
      } else if (records.type === "private" && records.isChecked === true) {
        for (const event of records.events) {
          /** change the studentAttendanceRecording isPaid field to true */
          if (event.isChecked) {
            const data = await db.teachersInPrivateSession.update(
              {
                isPaid: true,
                amountByStudent: records.amountByStudent,
                totalAmount: event.NumberOfAttendees * records.amountByStudent,
                NumberOfAttendees: event.NumberOfAttendees,
                salaireID: salaire.ID_ROWID,
              },
              {
                where: {
                  privateSessionID: event.id
                    .replace("normal_", "")
                    .replace("private_", ""),
                  teacherID: teacherID,
                },
              }
            );
          }
        }
      }
    }
    return res.send({
      message: `Student Bills is bien affecter successfully.`,
      code: 200,
    });
  } catch (error) {
    res.send({
      message: "An error occurred while fetching the Student Bills.",
      error: error.message,
      code: 400,
    });
    console.log(error);
  }
};

module.exports = {
  getTeacherSalaires,
  getUnpaidSalaire,
  payTeacherSalaire,
};
