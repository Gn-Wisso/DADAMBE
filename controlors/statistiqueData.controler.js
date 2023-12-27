const db = require(".././models");
const seq = require("sequelize");
const op = seq.Op;
require("dotenv").config();

const getStatistiqueDataForProgProfile = async (req, res, next) => {
    try {
        const { progID } = req.body;

        // Check if the necessary data (title) is provided
        if (!progID) {
            return res.send({
                message: "Error! Title is required.",
                code: 409
            });
        }
        /** nmb Student in Program */
        const student = await db.registration.findAll({
            where: {
                progID: progID
            }
        })
        const nmbStudent = student ? student.length : 0;
        /** fin */
        /** nmb teacher in this program */
        const totalDistinctTeachers = await db.teacher.count({
            distinct: true,
            include: [
                {
                    model: db.groupe,
                    where: {
                        progID: progID
                    },
                    attributes: [], // Ensure to specify the attributes you need from the group table if necessary
                    through: { attributes: [] } // To avoid loading the associated data
                }
            ]
        });

        console.log(`Total distinct teachers across all groups: ${totalDistinctTeachers}`);
        /** nmb groupes in program*/
        const group = await db.groupe.findAll({
            where: {
                progID: progID
            },
        });
        const nmbGroup = group ? group.length : 0;

        return res.send({
            message: `fetsh statistic data successfully.`,
            staticData: {
                "nmbStudent": nmbStudent,
                "nmbTeachers": totalDistinctTeachers,
                "nmbGroup": nmbGroup,
            },
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while fetshing data.",
            error: error.message,
            code: 400
        });
    }
};


const getStatistiqueDataForDashbaord1 = async (req, res, next) => {
    try {
        console.log("aaaaaaaaaaaaaaaaaaaa");
        /** nmb Student  */
        const students = await db.student.findAll({
            attributes: ['ID_ROWID']
        });
        const nmbStudents = students ? students.length : 0;

        /** nmb teacher*/
        const teachers = await db.teacher.findAll({
            attributes: ['ID_ROWID']
        });
        const nmbTeachers = teachers ? teachers.length : 0;
        /** nmb programs*/
        const programs = await db.program.findAll({
            attributes: ['ID_ROWID']
        });
        const nmbPrograms = programs ? programs.length : 0;

        /** nmb classes*/
        const classes = await db.class.findAll({
            attributes: ['ID_ROWID']
        });
        const nmbClasses = classes ? classes.length : 0;
        /** fin */
        return res.send({
            message: `fetsh statistic data successfully.`,
            staticData: {
                "nmbStudents": nmbStudents,
                "nmbTeachers": nmbTeachers,
                "nmbPrograms": nmbPrograms,
                "nmbClasses": nmbClasses
            },
            code: 200
        });

    } catch (error) {
        console.log(error);
        return res.send({
            message: "An error occurred while adding the category.",
            error: error.message,
            code: 400
        });
    }
};

const getStatistiqueDataForNewStudentccountChart = async (req, res, next) => {
    try {
        const studentData = db.student.findAll({
            attributes: ['ID_ROWID', 'createdAt']
        });
        /** fin */
        return res.send({
            message: `fetsh statistic data successfully.`,
            staticData: {
                "studentData": studentData,
            },
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the category.",
            error: error.message,
            code: 400
        });
    }
};

const getStatistiqueDataForNewStudentRegestrationChart = async (req, res, next) => {
    try {
        // get all programes regestrations numbers in the last month
        // Calculate the date range for the last month
        const currentDate = new Date();
        const lastMonthStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastMonthEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        const data = await db.registration.findAll({
            group: ['progID']
        });

        /** fin */
        return res.send({
            message: `fetsh statistic data successfully.`,

            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the category.",
            error: error.message,
            code: 400
        });
    }
};

module.exports = {
    getStatistiqueDataForProgProfile,
    getStatistiqueDataForDashbaord1,
    getStatistiqueDataForNewStudentccountChart
}