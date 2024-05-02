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
    const studentAttResList = await db.studentAttendanceRecording.findAll({
      where: {
        sessionID: id,
      },
    });
    // get teacher Attendance Recording
    const teacherAttResList = await db.teacherAttendanceRecording.findAll({
      where: {
        sessionID: id,
      },
    });

    // get groupe id
    const session = await db.session.findByPk(id, {
      include: {
        model: db.groupe,
        attributes: ["ID_ROWID", "GroupeName"],
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
          {
            model: db.program,
            attributes: ["ID_ROWID", "title"],
            required: false,
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
    res.send({
      message:
        "An error occurred while fetching the Session Attendance Recording.",
      error: error.message,
      code: 400,
    });
    console.log(error);
  }
};

const updateSessionAttendanceRecording = async (req, res, next) => {
  try {
    const { studentList, teacherList, idProg, id } = req.body.data;
    // Check if the necessary data (title) is provided

    // get program type of paiment
    const prog = await db.program.findByPk(idProg, {
      attributes: ["typeOfPaiment"],
    });
    // create new Attendance Recording For Student
    // get all this session student rec
    const rec = await db.studentAttendanceRecording.findAll({
      where: {
        sessionID: id,
      },
      attributes: ["studentID"],
    });
    // Get an array of studentIDs from the rec array
    const presentStudentIDs = rec.map((record) => record.studentID);

    // Extract IDs from studentList array
    const studentIDsInList = studentList.map((student) => student.id);

    // Filter out the studentIDs that are not present in the studentList
    const studentIDsToDelete = presentStudentIDs.filter(
      (studentID) => !studentIDsInList.includes(studentID)
    );

    // Delete records where studentID is not in the studentList
    await db.studentAttendanceRecording.destroy({
      where: {
        sessionID: id,
        studentID: studentIDsToDelete,
      },
    });
    studentList.forEach(async (student) => {
      // find if student record already exicte :
      const rec = await db.studentAttendanceRecording.findAll({
        where: {
          sessionID: id,
          studentID: student.id,
        },
      });

      if (Array.isArray(rec) && rec.length === 0) {
        if (prog && prog.typeOfPaiment == "Total") {
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
      }
    });
    /** teacher part  */

    const recTeacher = await db.teacherAttendanceRecording.findAll({
      where: {
        sessionID: id,
      },
      attributes: ["teacherID"],
    });
    // Get an array of teacherIDs from the rec array
    const presentTeacherIDs = recTeacher.map((record) => record.teacherID);

    // Extract IDs from teacherList array
    const teacherIDsInList = teacherList.map((teacher) => teacher.id);

    // Filter out the teacherIDs that are not present in the teacherList
    const teacherIDsToDelete = presentTeacherIDs.filter(
      (teacherID) => !teacherIDsInList.includes(teacherID)
    );

    // Delete records where teacherID is not in the teacherList
    await db.teacherAttendanceRecording.destroy({
      where: {
        sessionID: id,
        teacherID: teacherIDsToDelete,
      },
    });
    // create new Attendance Recording For Student
    teacherList.forEach(async (teacher) => {
      // find if teacher record already exicte :
      const rec = await db.teacherAttendanceRecording.findAll({
        where: {
          sessionID: id,
          teacherID: teacher.id,
        },
      });
      if (Array.isArray(rec) && rec.length === 0) {
        await db.teacherAttendanceRecording.create({
          teacherID: teacher.id,
          sessionID: id,
          NumberOfAttendees: studentList ? studentList.lenght : 0,
        });
      }
    });
    // update session
    await db.session.update(
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

const getSessionAttendanceRecordingForStuent = async (req, res, next) => {
  try {
    const { id } = req.params; // student id
    // Check if the necessary data (title) is provided
    if (!id) {
      return res.send({
        message: "Error! id is required.",
        code: 409,
      });
    }
    // get all sessions thas student is recorded in it

    const studentData = await db.student.findByPk(id, {
      attributes: ["ID_ROWID"],
      include: [
        {
          model: db.session,
          required: false,
          through: {
            model: db.studentAttendanceRecording,
            attributes: ["isPaid"], // Include the isPaid attribute
          },
          include: [
            {
              model: db.groupe,
              attributes: ["ID_ROWID", "GroupeName"],
              include: {
                model: db.program,
                attributes: ["ID_ROWID", "title"],
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
        {
          model: db.privateSession,
          required: false,
          through: {
            model: db.studentsInPrivateSession,
            attributes: ["isAttended", "isPaid"], // Include the isPaid attribute
            where: {
              isAttended: true,
            },
          },
          include: {
            model: db.class,
            attributes: ["ID_ROWID", "className"],
            required: false,
          },
        },
      ],
    });
    const events = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    currentDate.setDate(currentDate.getDate() + 1);
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
          : "No Groupe";
        const progDetails =
          session.groupe && session.groupe.program
            ? session.groupe.program.title
            : "No programme";
        // Create events based on session data
        events.push({
          id: sessionId, // Unique identifier for the event
          date: date,
          sortDate: new Date(`${date} ${startAt}`),
          title: `Programme ${progDetails} - Groupe ${groupeDetails} - Salle ${salleDetails}`, // Event title combining group and class details
          start: startAt, // Combine date and time for start
          end: endAt, // Combine date and time for end
          prog: { id: session.groupe.program.ID_ROWID, name: progDetails },
          isPaid: session?.studentAttendanceRecording?.isPaid,
          type: "normal",
          // Add other event properties as needed
        });
      }
    });
    studentData?.privateSessions.forEach((session) => {
      // Extract session details
      const { ID_ROWID: sessionId, startAt, endAt, date } = session;
      if (new Date(`${date} ${endAt}`) < currentDate) {
        // Extract class details if available
        const salleDetails = session.class
          ? session.class.className
          : "non défini";

        // Create events based on session data
        events.push({
          id: sessionId, // Unique identifier for the event
          date: date,
          sortDate: new Date(`${date} ${startAt}`),
          title: `Séance Privé - Salle ${salleDetails}`, // Event title combining group and class details
          start: startAt, // Combine date and time for start
          end: endAt, // Combine date and time for end
          isPaid: session?.studentsInPrivateSession?.isPaid,
          type: "private",
          // Add other event properties as needed
        });
      }
    });
    // Sort events by start date in descending order
    events.sort((a, b) => b.sortDate - a.sortDate);
    return res.send({
      message: `Session Attendance Recording is fetch successfully.`,
      sessionAttRec: events,
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
const getSessionAttendanceRecordingForTeacher = async (req, res, next) => {
  try {
    const { id } = req.params; // Teacher ID
    // Check if the necessary data (teacher ID) is provided
    if (!id) {
      return res.send({
        message: "Error! Teacher ID is required.",
        code: 409,
      });
    }
    // Get all sessions where the teacher is recorded
    const teacherData = await db.teacher.findByPk(id, {
      attributes: ["ID_ROWID"],
      include: [
        {
          model: db.session,
          required: false,
          through: {
            model: db.teacherAttendanceRecording,
            attributes: ["NumberOfAttendees"], // Include any other relevant attributes
          },
          include: [
            {
              model: db.groupe,
              attributes: ["ID_ROWID", "GroupeName"],
              include: {
                model: db.program,
                attributes: ["ID_ROWID", "title"],
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
        {
          model: db.privateSession,
          required: false,
          through: {
            model: db.teachersInPrivateSession,
            attributes: ["isAttended", "isPaid"], // Include the isPaid attribute
            where: {
              isAttended: true,
            },
          },
          include: {
            model: db.class,
            attributes: ["ID_ROWID", "className"],
            required: false,
          },
        },
      ],
    });
    // Prepare session attendance recording data
    const events = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    currentDate.setDate(currentDate.getDate() + 1);
    teacherData?.sessions.forEach((session) => {
      // Extract session details
      const { ID_ROWID: sessionId, startAt, endAt, date } = session;
      if (new Date(`${date} ${endAt}`) < currentDate) {
        // Extract class details if available
        const salleDetails = session.class
          ? session.class.className
          : "non défini";
        const groupeDetails = session.groupe
          ? session.groupe.GroupeName
          : "No Groupe";
        const progDetails =
          session.groupe && session.groupe.program
            ? session.groupe.program.title
            : "No programme";
        // Create events based on session data
        events.push({
          id: sessionId, // Unique identifier for the event
          date: date,
          sortDate: new Date(`${date} ${startAt}`),
          title: `Programme ${progDetails} - Groupe ${groupeDetails} - Salle ${salleDetails}`, // Event title combining group and class details
          start: startAt, // Combine date and time for start
          end: endAt, // Combine date and time for end
          prog: { id: session.groupe.program.ID_ROWID, name: progDetails },
          numberOfAttendees:
            session?.teacherAttendanceRecording?.NumberOfAttendees || 0,
          // Add other event properties as needed
        });
      }
    });
    teacherData?.privateSessions.forEach((session) => {
      // Extract session details
      const { ID_ROWID: sessionId, startAt, endAt, date } = session;
      if (new Date(`${date} ${endAt}`) < currentDate) {
        // Extract class details if available
        const salleDetails = session.class
          ? session.class.className
          : "non défini";

        // Create events based on session data
        events.push({
          id: sessionId, // Unique identifier for the event
          date: date,
          sortDate: new Date(`${date} ${startAt}`),
          title: `Séance Privé - Salle ${salleDetails}`, // Event title combining group and class details
          start: startAt, // Combine date and time for start
          end: endAt, // Combine date and time for end
          isPaid: session?.teachersInPrivateSession?.isPaid,
          type: "private",
          // Add other event properties as needed
        });
      }
    });
    // Sort events by start date in descending order
    events.sort((a, b) => b.sortDate - a.sortDate);
    return res.send({
      message: `Session Attendance Recording for Teacher is fetched successfully.`,
      sessionAttRec: events,
      code: 200,
    });
  } catch (error) {
    res.send({
      message:
        "An error occurred while fetching the Session Attendance Recording for Teacher.",
      error: error.message,
      code: 400,
    });
    console.log(error);
  }
};

module.exports = {
  getSessionAttendanceRecording,
  updateSessionAttendanceRecording,
  getSessionAttendanceRecordingForStuent,
  getSessionAttendanceRecordingForTeacher,
};
