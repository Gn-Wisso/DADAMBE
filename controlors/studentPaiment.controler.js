const db = require("../models");
const seq = require("sequelize");
const Op = seq.Op;
require("dotenv").config();

const getStudentBills = async (req, res, next) => {
  try {
    const { id } = req.params; // student id
    // Check if the necessary data (title) is provided
    if (!id) {
      return res.send({
        message: "Error! id is required.",
        code: 409,
      });
    }
    const data = await db.bill.findAll({
      where: {
        studentID: id,
      },
      include: [
        {
          model: db.paymentSessionMode,
          required: false,
          include: [
            {
              model: db.studentAttendanceRecording,
              required: false,
              throw: {
                model: db.session,
                attributes: ["ID_ROWID", "startAt", "endAt", "date"],
                include: {
                  model: db.groupe,
                  attributes: ["ID_ROWID", "GroupeName"],
                  include: {
                    model: db.program,
                    attributes: ["ID_ROWID", "title"],
                    required: false,
                  },
                },
              },
            },
          ],
        },
        {
          model: db.paymentTotalMode,
          required: false,
          include: {
            model: db.program,
            attributes: ["ID_ROWID", "title"],
            required: false,
          },
        },
      ],
    });
    data.sort((a, b) => b.createdAt - a.createdAt);
    return res.send({
      message: `Student Bills is fetch successfully.`,
      bills: data,
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

// get unpaid bills
const getUnpaidBills = async (req, res, next) => {
  try {
    const { id } = req.params; // student id
    // Check if the necessary data (title) is provided
    if (!id) {
      return res.send({
        message: "Error! id is required.",
        code: 409,
      });
    }

    const studentData = await db.student.findByPk(id, {
      attributes: ["ID_ROWID"],
      include: [
        {
          model: db.session,
          required: false,
          through: {
            model: db.studentAttendanceRecording,
            attributes: ["isPaid"], // Include the isPaid attribute
            where: {
              isPaid: false,
            },
          },
          include: [
            {
              model: db.groupe,
              attributes: ["ID_ROWID", "GroupeName"],
              include: {
                model: db.program,
                attributes: ["ID_ROWID", "title", "typeOfPaiment", "prix"],
                required: false,
              },
            },
            {
              model: db.class,
              attributes: ["ID_ROWID", "className"],
              required: false,
            },
          ],
        },
      ],
    });
    const events = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    studentData?.sessions.forEach((session) => {
      // Extract session details
      const { ID_ROWID: sessionId, startAt, endAt, date } = session;
      if (new Date(`${date} ${endAt}`) < currentDate) {
        // Extract class details if available
        const salleDetails = session.class
          ? session.class.className
          : "non défini";
        const groupeDetails = session.groupe
          ? session.groupe.GroupeName
          : "non défini";
        const progDetails =
          session.groupe && session.groupe.program
            ? session.groupe.program.title
            : "non défini";
        // Create events based on session data
        events.push({
          id: sessionId, // Unique identifier for the event
          date: date,
          sortDate: new Date(`${date} ${startAt}`),
          start: startAt, // Combine date and time for start
          end: endAt, // Combine date and time for end
          prog: {
            id: session.groupe.program.ID_ROWID,
            name: progDetails,
            type: session.groupe.program.typeOfPaiment,
            prix: session.groupe.program.prix,
          },
          isPaid: session?.studentAttendanceRecording?.isPaid,
          isChecked: true,
          // Add other event properties as needed
        });
      }
    });
    // Group events by program ID

    const groupedEvents = events.reduce((acc, event) => {
      const { id, name, prix, type } = event.prog;
      if (!acc[id]) {
        acc[id] = {
          id,
          title: name, // Include program title
          prix,
          type,
          isChecked: true,
          montant: type != "Total" ? 0 : prix,
          quantite: 0,
          events: [],
        };
      }
      acc[id].events.push(event);
      if (type != "Total") {
        acc[id].montant = acc[id].events?.length * prix;
        acc[id].quantite = acc[id].events?.length;
      }
      return acc;
    }, {});
    console.log(groupedEvents);
    return res.send({
      message: `Student Bills is fetch successfully.`,
      unpaidBills: groupedEvents,
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
const payStudentBillsMultiMode = async (req, res, next) => {
  try {
    const { studentID, paimentRecord, total } = req.body.data; // student id
    for (const key in paimentRecord) {
      const records = paimentRecord[key];
      /** create the bills */
      const bill = await db.bill.create({
        totalAmount: total,
        studentID: studentID,
      });
      if (records.type == "Total") {
        if (records.isChecked) {
          /**  insert the records */
          /**     in paymentTotalMode */
          await db.paymentTotalMode.create({
            amount: records.prix,
            progID: records.id,
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
                  sessionID: event.id,
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
                  sessionID: event.id,
                  studentID: studentID,
                },
              }
            );

            const data = await db.studentAttendanceRecording.findAll({
              where: {
                sessionID: event.id,
                studentID: studentID,
              },
            });
            /**  insert the records */
            /**     in paymentSessionMode */
            await db.paymentSessionMode.create({
              amount: records.prix,
              StudentAttRecID: data[0]?.ID_ROWID,
              billD: bill.ID_ROWID,
            });
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
  getStudentBills,
  getUnpaidBills,
  payStudentBillsMultiMode,
};
