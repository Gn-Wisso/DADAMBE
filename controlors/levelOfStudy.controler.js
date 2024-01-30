const db = require("../models");
const seq = require("sequelize");
const op = seq.Op;
require("dotenv").config();

// Functions to add 
const addEducationLevel = async (req, res, next) => {
    try {
        const { lib } = req.body.data;

        // Check if the necessary data is provided
        if (!lib) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }

        // Creating a new class record in the database
        await db.educationalLevel.create({
            lib: lib,
        });

        return res.send({
            message: `educational Level '${lib}' has been added successfully.`,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the class.",
            error: error.message,
            code: 400
        });
    }
};
const addStudyYear = async (req, res, next) => {
    try {
        const { lib, levelID } = req.body.data;

        // Check if the necessary data is provided
        if (!lib || !levelID) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }

        // Creating a new class record in the database
        await db.studyYear.create({
            lib: lib,
            LevelID: levelID
        });

        return res.send({
            message: `educational Level '${lib}' has been added successfully.`,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the class.",
            error: error.message,
            code: 400
        });
    }
};
// Functions to update 
const updateEducationLevel = async (req, res, next) => {
    try {
        const { idLevel, lib } = req.body.data;
        // Check if the necessary data is provided
        if (!idLevel || !lib) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }
        // Creating a new class record in the database
        await db.educationalLevel.update({
            lib: lib,
        },
            {
                where: { ID_ROWID: idLevel }
            });

        return res.send({
            message: `educational Level '${lib}' has been updated successfully.`,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the class.",
            error: error.message,
            code: 400
        });
    }
};
const updateStudyYear = async (req, res, next) => {
    try {
        const { idYear, lib } = req.body.data;
        // Check if the necessary data is provided
        if (!idYear || !lib) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }
        // Creating a new class record in the database
        await db.studyYear.update({
            lib: lib,
        },
            {
                where: { ID_ROWID: idYear }
            });

        return res.send({
            message: `studyYear '${lib}' has been updated successfully.`,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the class.",
            error: error.message,
            code: 400
        });
    }
};
// Functions to delete 
const deleteEducationLevel = async (req, res, next) => {
    try {
        const levelId = req.params.id;  // Assuming the level ID is passed as a parameter in the URL

        if (!levelId) {
            return res.send({
                message: "Error! level ID is required for deletion.",
                code: 400
            });
        }
        // find out if this level is not used before in student
        const result = await db.studentLevel.findAll({
            where: {
                levelID: levelId
            }
        })
        if (result.length !== 0) {
            res.send({
                message: "we Can't delete this level because he is allready used by students",
                code: 401
            });
        }
        await db.educationalLevel.destroy({
            where: { ID_ROWID: levelId }
        });

        return res.send({
            message: "educationalLevel deleted successfully!",
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while deleting the class.",
            error: error.message,
            code: 400
        });
    }
};
const deleteStudyYear = async (req, res, next) => {
    try {
        const yearId = req.params.id;  // Assuming the year ID is passed as a parameter in the URL

        if (!yearId) {
            return res.send({
                message: "Error! year ID is required for deletion.",
                code: 400
            });
        }
        // find out if this level is not used before in student
        const result = await db.studentLevel.findAll({
            where: {
                yearID: yearId
            }
        })
        if (result.length !== 0) {
            res.send({
                message: "we Can't delete this level because he is allready used by students",
                code: 400
            });
        }
        await db.studyYear.destroy({
            where: { ID_ROWID: yearId }
        });

        return res.send({
            message: "studyYear deleted successfully!",
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while deleting the studyYear.",
            error: error.message,
            code: 400
        });
    }
};
// function to futch
const allEducLevelWStudyYear = async (req, res, next) => {
    try {

        const result = await db.educationalLevel.findAll(
            {
                include: {
                    model: db.studyYear,
                    required: false
                }
            }
        );
        return res.send({
            message: `fetshing the list of all educational Level with study year.`,
            allLevels: result,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while fetshing the class.",
            error: error.message,
            code: 400
        });
    }
};
module.exports = {
    addEducationLevel,
    addStudyYear,
    updateEducationLevel,
    updateStudyYear,
    deleteEducationLevel,
    deleteStudyYear,
    allEducLevelWStudyYear
};
