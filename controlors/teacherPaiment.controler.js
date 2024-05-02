const db = require("../models");
const seq = require("sequelize");
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
        const extraData = await db.teacher.findByPk(id, {
          include: [
            {
              model: db.groupe,
              attributes: ["ID_ROWID", "GroupeName"],
              include: [
                {
                  model: db.program,
                  attributes: ["ID_ROWID", "title"],
                  required: false,
                },
                {
                  model: db.session,
                  attributes: ["ID_ROWID"],

                  include: {
                    model: db.teacher,
                    where: { ID_ROWID: id },
                    attributes: ["ID_ROWID"],
                    through: {
                      model: db.teacherAttendanceRecording,
                      where: {
                        isPaid: true,
                        salaireID: salaire.ID_ROWID,
                        teacherID: salaire.teacherID,
                      },
                    },
                  },
                },
              ],
              required: false,
            },
            {
              model: db.privateSession,
              required: false,
              attributes: ["ID_ROWID"],
              include: {
                model: db.teacher,
                attributes: ["ID_ROWID"],
                where: { ID_ROWID: id },
                through: {
                  model: db.teachersInPrivateSession,
                  where: {
                    isAttended: true,
                    isPaid: true,
                    salaireID: salaire.ID_ROWID,
                    teacherID: id,
                  },
                },
              },
            },
          ],
        });

        const normalSessions = extraData?.groupes
          .map((groupe) => {
            if (groupe.sessions.length !== 0) {
              return {
                title: `Programme ${groupe.program.title}`,
                nmbSessions: groupe.sessions.length,
                sessions: groupe.sessions.map((session) => ({
                  amountByStudent:
                    session.teacherAttendanceRecording.amountByStudent,
                  NumberOfAttendees:
                    session.teacherAttendanceRecording.NumberOfAttendees,
                  totalAmount: session.teacherAttendanceRecording.totalAmount,
                })),
              };
            }
          })
          .filter(Boolean);
        const privateSessions = extraData?.privateSessions
          .map((session) => {
            return {
              title: `Private Session`,
              nmbSessions: 1,
              sessions: [
                {
                  amountByStudent:
                    session.teachersInPrivateSession.amountByStudent,
                  NumberOfAttendees:
                    session.teachersInPrivateSession.NumberOfAttendees,
                  totalAmount: session.teachersInPrivateSession.totalAmount,
                },
              ],
            };
          })
          .filter(Boolean);
        return {
          id: salaire.ID_ROWID,
          totalAmount: salaire.totalAmount,
          date: salaire.createdAt,
          sessions: normalSessions + privateSessions,
        };
      })
    );

    return res.status(200).json({
      message: `Teacher Bills fetched successfully.`,
      bills: salaireData,
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
            {
              model: db.studentsInPrivateSession,
              where: {
                isAttended: true,
              },
              attributes: ["ID_ROWID"], // Include the isPaid attribute
            },
          ],
        },
      ],
    });
    const events = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    teacherData?.sessions.forEach((session) => {
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
    });

    teacherData?.privateSessions.forEach((session) => {
      // Extract session details
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
          NumberOfAttendees: session.studentsInPrivateSession.length,
          type: "private",
          // Add other event properties as needed
        });
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
    const bill = await db.bill.create({
      totalAmount: total,
      studentID: studentID,
    });
    for (const key in paimentRecord) {
      const records = paimentRecord[key];
      /** create the bills */
      // Creating a new payment record in the database
      if (records.eventT === "normal") {
        const newPayment = await db.payment.create({
          montant: records.prix,
          progID: records.id, // id prog
          StudentID: studentID,
        });
        if (records.type == "Total") {
          if (records.isChecked) {
            /**  insert the records */
            /**     in paymentTotalMode */
            await db.paymentTotalMode.create({
              amount: records.prix,
              progID: records.id, // id prog
              billD: bill.ID_ROWID,
            });
            for (const event of records.events) {
              /** change the studentAttendanceRecording isPaid field to true */
              const data = await db.studentAttendanceRecording.update(
                {
                  isPaid: true,
                },
                {
                  where: {
                    sessionID: event.id
                      .replace("normal_", "")
                      .replace("private_", ""),
                    studentID: studentID,
                  },
                }
              );
            }
          }
        } else {
          for (const event of records.events) {
            /** change the studentAttendanceRecording isPaid field to true */
            if (event.isChecked) {
              await db.studentAttendanceRecording.update(
                {
                  isPaid: true,
                },
                {
                  where: {
                    sessionID: event
                      .idreplace("normal_", "")
                      .replace("private_", ""),
                    studentID: studentID,
                  },
                }
              );

              const data = await db.studentAttendanceRecording.findAll({
                where: {
                  sessionID: event.id
                    .replace("normal_", "")
                    .replace("private_", ""),
                  studentID: studentID,
                },
              });
              /**  insert the records */
              /**     in paymentSessionMode */
              await db.paymentSessionMode.create({
                amount: records.prix,
                StudentAttRecID: data[0]?.ID_ROWID,
                billD: bill.ID_ROWID,
                studentID: studentID,
              });
            }
          }
        }
      } else if (records.eventT === "private" && records.isChecked === true) {
        // update studentsInPrivateSession
        await db.studentsInPrivateSession.update(
          {
            isPaid: true,
            amount: records.prix,
            billID: bill.ID_ROWID,
          },
          {
            where: {
              privateSessionID: records.id
                .replace("normal_", "")
                .replace("private_", ""),
              studentID: studentID,
            },
          }
        );
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
