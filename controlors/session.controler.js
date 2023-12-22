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
    const { startDate, endDate, days, duration } = req.body.data;

    const dividedIntervals = {};
    const datesForCodeDay = {};
    for (const day in days) {
        const intervals = [];
        days[day].timeZones.map(interval => {
            console.log()
            divideTimeInterval(interval.timeStart, interval.timeEnd, duration, intervals);
        });
        dividedIntervals[day] = intervals;
        datesForCodeDay[day] = getDatesForCodeDayBetween(startDate, endDate, parseInt(day));
    }


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

    while (currentDate.isBefore(end)) {
        if (currentDate.day() === dayCode) { // Monday is represented as 1 in moment.js
            result.push(currentDate.format('YYYY-MM-DD'));

        }
        currentDate.add(1, 'days');
    }
    return result;
}


//devide intervlse :
function divideTimeInterval(startTime, endTime, duration, intervals) {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const durationParts = duration.split(':');
    const durationHours = parseInt(durationParts[0], 10);
    const durationMinutes = parseInt(durationParts[1], 10);
    const durationMillis = (durationHours * 60 + durationMinutes) * 60 * 1000;
    let current = new Date(start);

    while (current < end) {
        const subIntervalStart = new Date(current);
        const subIntervalEnd = new Date(current.getTime() + durationMillis);
        if (subIntervalEnd <= end) { intervals.push({ start: subIntervalStart.toLocaleTimeString(), end: subIntervalEnd.toLocaleTimeString() }); }

        current = subIntervalEnd;
    }

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
        .map(session => session.groupID);

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
        data.groupes.forEach((groupe) => {
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
                    groupID: groupe.ID_ROWID
                    // Add other event properties as needed
                });
            })
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
            const salleDetails = session.class ? session.class.GroupeName : 'No Salle';
            const groupeDetails = session.groupe ? session.groupe.GroupeName : 'No Groupe';
            const progDetails = (session.groupe && session.groupe.program) ? session.groupe.program.title : 'No programme';
            // Create events based on session data
            events.push({
                id: sessionId, // Unique identifier for the event
                title: `Programme ${progDetails} - Groupe ${groupeDetails} - Groupe ${salleDetails}`, // Event title combining group and class details
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
module.exports = {
    getAvailableData,
    addSessions,
    getAllSessionsInProg,
    deleteSession,
    getAllSessionsForSalle,
    getAllSessions
};