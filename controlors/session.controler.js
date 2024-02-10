const db = require(".././models");
const seq = require("sequelize");
require("dotenv").config();
const Op = seq.Op;
const moment = require('moment');

function isDateBetween(startDate, endDate, targetDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const target = new Date(targetDate);
    return start <= target && target <= end;
}

const getAvailableData = async (req, res, next) => {
    const { startDate, endDate, days, duration, type } = req.body.data;

    const dividedIntervals = {};
    const datesForCodeDay = {};
    for (const day in days) {
        console.log(day);
        const intervals = [];

        days[day].timeZones.map(interval => {

            divideTimeInterval(interval.timeStart, interval.timeEnd, duration, intervals);

        });
        dividedIntervals[day] = intervals;

        datesForCodeDay[day] = getDatesForCodeDayBetween(startDate, endDate, parseInt(day));
    }
    console.log("I am IN ------------------------------------------------------------------------------------------------------------");
    // get Classes with thiere sessions
    const sessions = await db.session.findAll();

    const classeSessions = sessions.map((session) => {
        if (isDateBetween(startDate, endDate, session.date)) return session;
    });
    // get all classes
    const classes = await db.class.findAll({
        attributes: ['ID_ROWID', 'className']
    });

    const plans = {};


    for (const codeDay in dividedIntervals) {
        var i = 0;
        plans[codeDay] = {}; // Initialize plans[codeDay] as an object

        await Promise.all(dividedIntervals[codeDay].map(async (interval) => {
            var max = 0;
            const data = await Promise.all(datesForCodeDay[codeDay].map(async (day) => {
                const availableClasses = await getAvailableClass(day, interval.start, interval.end, classes);
                max = max < availableClasses.length ? availableClasses.length : max;
                return { "day": day, "classes": availableClasses };
            }));

            const obj = {
                "start": interval.start,
                "end": interval.end,
                "used": max,
                "data": data
            };

            plans[codeDay][`plan ${i}`] = obj;
            i++;
        }));
    }
    console.log(plans)
    return res.send({
        plans: plans,
        message: "futch plans data successfully",
        code: 200,
    });
}


// get date for day code
function getDatesForCodeDayBetween(dateStart, dateEnd, dayCode) {
    const result = [];
    const start = new Date(dateStart);
    const end = new Date(dateEnd);
    var currentDate = moment(start);
    dayCode == 7 ? dayCode = 0 : dayCode;

    while (currentDate.isBefore(end)) {
        console.log(currentDate.day());
        if (currentDate.day() === dayCode) { // Monday is represented as 1 in moment.js
            result.push(currentDate.format('YYYY-MM-DD'));

        }
        currentDate.add(1, 'days');
    }
    return result;
}


function divideTimeInterval(startTime, endTime, duration, intervals) {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
     console.log("hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
     console.log(startTime);
     console.log(endTime);
     if (!duration) {
        const [hours1, minutes1] = startTime.split(':').map(Number);
        const [hours2, minutes2] = endTime.split(':').map(Number);

        const totalMinutes1 = (hours1 * 60) + minutes1;
        const totalMinutes2 = (hours2 * 60) + minutes2;
        let intervalMinutes = Math.abs(totalMinutes2 - totalMinutes1);
        // Calculate hours and remaining minutes
        const hours = Math.floor(intervalMinutes / 60);
        const minutes = intervalMinutes % 60;
        duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    }

    const durationParts = duration.split(':');
    const durationHours = parseInt(durationParts[0], 10);
    const durationMinutes = parseInt(durationParts[1], 10);
    const durationMillis = (durationHours * 60 + durationMinutes) * 60 * 1000;

    let current = new Date(start);

    while (current < end) {
        const subIntervalStart = new Date(current);
        const subIntervalEnd = new Date(current.getTime() + durationMillis);

        if (subIntervalEnd <= end) {
            intervals.push({
                start: subIntervalStart.toISOString().substr(11, 5), // Extract HH:mm
                end: subIntervalEnd.toISOString().substr(11, 5)
            });
        }

        current = subIntervalEnd;
    }
    console.log("-------------------------------------------------------------------------");
    console.log(intervals);
    return intervals;
}

// check available classes in a day and time
async function getAvailableClass(date, timeStart, timeFinish, classes) {
    const start = new Date(`1970-01-01T${timeStart}`);
    const end = new Date(`1970-01-01T${timeFinish}`);

    // Retrieve sessions within the specified date
    const sessions = await db.session.findAll({
        where: {
            date: date
        }
    });

    // Map reserved classes based on time range
    const reservedClasses = sessions
        .filter(session => {
            const sTStart = new Date(`1970-01-01T${session.startAt}`);
            const eTStart = new Date(`1970-01-01T${session.endAt}`);
            return start < eTStart && end > sTStart;
        })
        .map(session => session.classID);

    // Find classes that are not reserved during the specified time range
    const inReservedClasses = classes
        .filter(classe => !reservedClasses.includes(classe.ID_ROWID))
        .map(classe => ({ "id": classe.ID_ROWID, "name": classe.className }));
    return inReservedClasses;
}

//// finaly add sessions

const addSessions = async (req, res, next) => {
    try {
        const { dataSessions } = req.body;

        for (const groupKey in dataSessions) {
            const group = dataSessions[groupKey];

            for (const dayKey in group.days) {
                const day = group.days[dayKey];
                const dayCode = day.codeDay;

                for (const planKey in day.plans) {
                    const plan = day.plans[planKey];
                    for (const dateKey in plan.data) {
                        const date = plan.data[dateKey];

                        await db.session.create({
                            dayCode: dayCode,
                            date: date.day,
                            startAt: plan.start,
                            endAt: plan.end,
                            groupID: group.groupID,
                            classID: date.classes[0].id
                        });
                    }
                }
            }
        }

        return res.send({
            message: "Sessions added successfully",
            code: 200,
        });
    } catch (error) {
        console.log(error)
        return res.send({
            message: "Error adding sessions",
            code: 500,
            error: error.message
        });
    }
}
// delete session
const deleteSession = async (req, res, next) => {
    try {
        const { idSession } = req.body;
        await db.session.destroy({
            where: { ID_ROWID: idSession }
        });
        return res.send({
            message: "Session deleted successfully",
            code: 200,
        });
    } catch (error) {
        console.log(error)
        return res.send({
            message: "Error deleting the session",
            code: 500,
            error: error.message
        });
    }
}
// get all sessions related to a program 

const getAllSessionsInProg = async (req, res, next) => {
    try {
        const { idProg } = req.body;
        if (!idProg) {
            return res.send({
                message: "Error to fetch Session",
                code: 400,
            });
        }
        const data = await db.program.findByPk(idProg, {
            include: {
                model: db.groupe,
                attributes: ['ID_ROWID', 'GroupeName'],
                include: {
                    model: db.session,
                    required: false,
                    include: {
                        model: db.class,
                        attributes: ['ID_ROWID', 'className'],
                        required: false
                    },
                },
                required: false
            }
        })
        const events = [];
        if (data && data.groupes) {
            data.groupes.forEach((groupe) => {
                if (groupe.sessions) {
                    groupe.sessions.forEach((session) => {
                        // Extract session details
                        const { ID_ROWID: sessionId, startAt, endAt, date } = session;

                        // Extract class details if available
                        const classDetails = session.class ? session.class.className : 'No class';

                        // Create events based on session data
                        events.push({
                            id: sessionId, // Unique identifier for the event
                            title: `Groupe ${groupe.GroupeName} - Salle ${classDetails}`, // Event title combining group and class details
                            start: new Date(`${date} ${startAt}`), // Combine date and time for start
                            end: new Date(`${date} ${endAt}`), // Combine date and time for end
                            groupID: groupe.ID_ROWID,
                            groupename: groupe.GroupeName
                            // Add other event properties as needed
                        });
                    })
                }
            });
        }
        return res.send({
            events: events,
            message: "Sessions fetch successfully",
            code: 200,
        });
    } catch (error) {
        console.log(error)
        return res.send({
            message: "Error to fetch sessions",
            code: 500,
            error: error.message
        });
    }
}

// get all sessions related to a salle
const getAllSessionsForSalle = async (req, res, next) => {
    try {
        const { idSalle } = req.body;
        if (!idSalle) {
            return res.send({
                message: "Error to fetch Session",
                code: 400,
            });
        }
        const data = await db.session.findAll({
            where: {
                classID: idSalle,
            },
            include: {
                model: db.groupe,
                attributes: ['ID_ROWID', 'GroupeName'],
                required: false,
                include: {
                    model: db.program,
                    attributes: ['ID_ROWID', 'title'],
                    required: false,
                }
            }
        })
        console.log(idSalle);
        const events = [];
        data.forEach((session) => {
            // Extract session details
            const { ID_ROWID: sessionId, startAt, endAt, date } = session;

            // Extract class details if available
            const groupeDetails = session.groupe ? session.groupe.GroupeName : 'No Groupe';
            const progDetails = (session.groupe && session.groupe.program) ? session.groupe.program.title : 'No programme';

            // Create events based on session data
            events.push({
                id: sessionId, // Unique identifier for the event
                title: `Programme ${progDetails} - Groupe ${groupeDetails}`, // Event title combining group and class details
                start: new Date(`${date} ${startAt}`), // Combine date and time for start
                end: new Date(`${date} ${endAt}`), // Combine date and time for end
                groupID: session.groupID
                // Add other event properties as needed
            });

        });
        return res.send({
            events: events,
            message: "Sessions fetch successfully",
            code: 200,
        });
    } catch (error) {
        console.log(error)
        return res.send({
            message: "Error to fetch sessions",
            code: 500,
            error: error.message
        });
    }
}


// get all sessions
const getAllSessions = async (req, res, next) => {
    try {

        const data = await db.session.findAll({
            include: [
                {
                    model: db.groupe,
                    attributes: ['ID_ROWID', 'GroupeName'],
                    required: false,
                    include: {
                        model: db.program,
                        attributes: ['ID_ROWID', 'title'],
                        required: false,
                    }
                }, {
                    model: db.class,
                    attributes: ['ID_ROWID', 'className'],
                    required: false,
                }
            ]
        })

        const events = [];
        data.forEach((session) => {
            // Extract session details
            const { ID_ROWID: sessionId, startAt, endAt, date } = session;

            // Extract class details if available
            const salleDetails = session.class ? session.class.className : 'No Salle';
            const groupeDetails = session.groupe ? session.groupe.GroupeName : 'No Groupe';
            const progDetails = (session.groupe && session.groupe.program) ? session.groupe.program.title : 'No programme';
            // Create events based on session data
            events.push({
                id: sessionId, // Unique identifier for the event
                title: `Programme ${progDetails} - Groupe ${groupeDetails} - Salle ${salleDetails}`, // Event title combining group and class details
                start: new Date(`${date} ${startAt}`), // Combine date and time for start
                end: new Date(`${date} ${endAt}`), // Combine date and time for end
                groupID: session.groupID
                // Add other event properties as needed
            });

        });
        return res.send({
            events: events,
            message: "Sessions fetch successfully",
            code: 200,
        });
    } catch (error) {
        console.log(error)
        return res.send({
            message: "Error to fetch sessions",
            code: 500,
            error: error.message
        });
    }
}


// get all sessions related to student
const getAllSessionsForStudent = async (req, res, next) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.send({
                message: "Error to fetch Session",
                code: 400,
            });
        }
        const data = await db.student.findByPk(id, {
            include: {
                model: db.groupe,
                attributes: ['ID_ROWID', 'GroupeName'],
                required: false,
                include: [{
                    model: db.program,
                    attributes: ['ID_ROWID', 'title'],
                    required: false,
                },
                {
                    model: db.session,
                    required: false,
                    include: {
                        model: db.class,
                        attributes: ['ID_ROWID', 'className'],
                        required: false
                    },
                }
                ]
            }
        })
        const events = [];
        if (data && data.groupes) {
            data.groupes.forEach((groupe) => {
                const progData = groupe.program;
                if (groupe.sessions) {
                    groupe.sessions.forEach((session) => {
                        // Extract session details
                        const { ID_ROWID: sessionId, startAt, endAt, date } = session;

                        // Extract class details if available
                        const classDetails = session.class ? session.class.className : 'No class';

                        // Create events based on session data
                        events.push({
                            id: sessionId, // Unique identifier for the event
                            title: `Programme ${progData.title} - Groupe ${groupe.GroupeName} - Salle ${classDetails}`, // Event title combining group and class details
                            start: new Date(`${date} ${startAt}`), // Combine date and time for start
                            end: new Date(`${date} ${endAt}`), // Combine date and time for end
                            groupID: groupe.ID_ROWID
                            // Add other event properties as needed
                        });
                    })
                }
            });
        }

        return res.send({
            events: events,
            message: "Sessions fetch successfully",
            code: 200,
        });
    } catch (error) {
        console.log(error)
        return res.send({
            message: "Error to fetch sessions",
            code: 500,
            error: error.message
        });
    }
}


// update session
const updateSession = async (req, res, next) => {
    try {
        const { eventID, date, startAt, endAt } = req.body.data;
        // find if ther is any available classes in this date and time
        // get all classes
        const classes = await db.class.findAll({
            attributes: ['ID_ROWID', 'className']
        });
        const result = await getAvailableClass(date, startAt, endAt, classes);
        if (result.length === 0) {
            return res.send({
                message: "Error updating the session",
                code: 401,
            });
        }

        await db.session.update({
            date: date,
            startAt: startAt,
            endAt: endAt,
            classID: result[0].id
        }, {
            where: { ID_ROWID: eventID }
        });
        return res.send({
            message: "Session updated successfully",
            code: 200,
        });
    } catch (error) {
        console.log(error)
        return res.send({
            message: "Error updating the session",
            code: 500,
            error: error.message
        });
    }
}
const getAllSessionsForTeacher = async (req, res, next) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.send({
                message: "Error to fetch Session",
                code: 400,
            });
        }
        
        const data = await db.teacherGroup.findAll({
            where: {
                TeacherID: id
            },
            include: [
                {
                    model: db.groupe,
                    as: 'group',
                    include: [
                        {
                            model: db.program // Corrected from db.programme
                        },
                        {
                            model: db.session,
                            include: {
                                model: db.class
                            }
                        }
                    ]
                },
                {
                    model: db.teacher,
                    as: 'teacher'
                }
            ]
        });
console.log(data);
        const events = [];
        if (data && data.length > 0) {
         
            data.forEach(teacherGroup => {
                
                if (teacherGroup.group && teacherGroup.group.program && teacherGroup.group.sessions) {           
console.log("------------------------------------------------------------------------");
                    teacherGroup.group.sessions.forEach(session => {

                        const { ID_ROWID: sessionId, startAt, endAt, date, class: className, ID_ROWID } = session;
                        events.push({
                            id: sessionId,
                            title: `Programme ${teacherGroup.group.program.title} - Groupe ${teacherGroup.group.GroupeName} - Salle ${className}`,
                            start: new Date(`${date} ${startAt}`),
                            end: new Date(`${date} ${endAt}`),
                            groupID: ID_ROWID,
                            groupName: teacherGroup.group.GroupeName,
                            // Add other event properties as needed
                        });
                    });
                }
            });
        } else {
            console.log("No data found or data is empty.");
        }
        

        return res.send({
            events: events,
            message: "Sessions fetch successfully",
            code: 200,
        });
    } catch (error) {
        console.log(error);
        return res.send({
            message: "Error to fetch sessions",
            code: 500,
            error: error.message,
        });
    }
};



module.exports = {
    getAvailableData,
    addSessions,
    getAllSessionsInProg,
    deleteSession,
    getAllSessionsForSalle,
    getAllSessions,
    getAllSessionsForStudent,
    updateSession,
    getAllSessionsForTeacher,
};