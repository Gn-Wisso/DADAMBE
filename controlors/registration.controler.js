const db = require(".././models");
const seq = require("sequelize");
const path = require('path');
const fs = require('fs');
const Fuse = require('fuse.js');
const op = seq.Op;
require("dotenv").config();

const addRegistration = async (req, res, next) => {
    try {
        const { IDstudent, date, Idprogram } = req.body.data;

        // Check if the necessary data is provided
        if (!IDstudent || !date || !Idprogram) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }

        // Check if the student is already registered for the program
        const existingRegistration = await db.registration.findOne({
            where: {
                StudentID: IDstudent,
                progID: Idprogram
            }
        });

        if (existingRegistration) {
            return res.send({
                message: "Error! The student is already registered for this program.",
                code: 409 // Conflict
            });
        }

        // Creating a new class record in the database
        const newregistration = await db.registration.create({
            dateInscription: date,
            progID: Idprogram,
            StudentID: IDstudent
        });

        return res.send({
            message: `The registration has been added successfully.`,
            classId: newregistration.ID_ROWID,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the registration.",
            error: error.message,
            code: 400
        });
    }
};


/**
 * Delete a registration from the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */

const removeRegistration = async (req, res, next) => {
    try {
        const registrationId = req.params.id; // Assuming the registration ID is passed as a parameter in the URL

        if (!registrationId) {
            return res.status(400).json({
                message: "Error! Registration ID is required for deletion.",
                code: 400
            });
        }
        // get user groups in the programe 
        const data = await db.registration.findByPk(registrationId);
        const groups = await db.groupe.findAll({
            where: {
                progID: data.progID
            },
            include: {
                model: db.student,
                where: {
                    ID_ROWID: data.StudentID
                }
            }
        });

        // destroy the studenGroup record
        if (groups.length) {
            const groupID = groups[0].ID_ROWID;
            await db.studentGroup.destroy({
                where: {
                    GroupeID: groupID,
                    StudentID: data.StudentID
                }
            })
        }



        const deletedRegistration = await db.registration.destroy({
            where: { ID_ROWID: registrationId }
        });

        if (!deletedRegistration) {
            return res.status(404).json({
                message: "Error! Registration not found.",
                code: 404
            });
        }

        return res.status(200).json({
            message: "Registration deleted successfully!",
            code: 200
        });

    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while deleting the registration.",
            error: error.message,
            code: 500
        });
    }
};

const listRegistrations = async (req, res, next) => {
    try {
        const registrations = await db.registration.findAll({
            include: [
                {
                    model: db.student,
                    as: 'students',
                    include: [{
                        model: db.person,
                        as: 'personProfile2',
                        attributes: ['firstName', 'lastName', 'mail', 'phoneNumber', 'dateOfBirth']
                    }]
                },
                {
                    model: db.program,
                    as: 'programs',
                    attributes: ['ID_ROWID', 'title']
                }
            ]
        });
        console.log(registrations);
        if (!registrations) {
            return res.send({
                message: "No registrations found.",
                code: 404
            });
        }

        return res.send({
            message: "Registrations fetched successfully.",
            registrations: registrations,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while fetching the registrations.",
            error: error.message,
            code: 400
        });
    }
};
// Programme Regestraions part
// this wisso from the other side to fix your side errors ;)
const listProgrammeRegistrations = async (req, res, next) => {
    try {
        const progId = req.body.progId;
        const registrations = await db.registration.findAll({
            where: {
                progID: progId
            },
            include: [
                {
                    model: db.student,
                    as: 'students',
                    include: [
                        {
                            model: db.person,
                            as: 'personProfile2',
                            attributes: ['firstName', 'lastName', 'imagePath']
                        },
                        {
                            model: db.groupe,
                            where: {
                                progID: progId
                            },
                            required: false // Make it optional
                        },
                    ]
                },
            ]
        });

        console.log(registrations);

        if (!registrations) {
            return res.send({
                message: "No registrations found.",
                code: 404
            });
        }

        // Modify the image paths in registrations
        for (const registration of registrations) {
            const student = registration.students; // Assuming there's only one student per registration
            if (student.personProfile2.imagePath !== null && student.personProfile2.imagePath !== '') {
                const photoPath = path.join("uploads/profileImage/", student.personProfile2.imagePath);
                try {
                    await fs.promises.access(photoPath, fs.constants.F_OK);
                    student.personProfile2.imagePath = await fs.promises.readFile(photoPath);
                } catch (error) {
                    console.error(error);
                    student.personProfile2.imagePath = null;
                }
            }
        }

        return res.send({
            message: "Registrations fetched successfully.",
            registrations: registrations,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while fetching the registrations.",
            error: error.message,
            code: 400
        });
    }
};
const updateRegistrationGroup = async (req, res, next) => {
    try {
        const { idRegestarion, idGroup, idStudent, idProg } = req.body.data;

        // Check if the necessary data is provided
        if (!idRegestarion || !idStudent || !idProg) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }
        // find the student previos group

        const groups = await db.groupe.findAll({
            where: {
                progID: idProg
            },
            include: [
                {
                    model: db.student,
                    where: {
                        ID_ROWID: idStudent
                    },
                    as: 'students',
                    attributes: ['ID_ROWID']
                }

            ]
        });
        if (groups.length) {
            const id = groups[0].ID_ROWID;
            db.studentGroup.destroy({
                where: {
                    GroupeID: id,
                    StudentID: idStudent
                }
            })
        }
        // associate the new groupe
        if (idGroup) {
            db.studentGroup.create({
                GroupeID: idGroup,
                StudentID: idStudent
            })
        }
        return res.send({
            message: `The registration has been added successfully.`,

            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the registration.",
            error: error.message,
            code: 400
        });
    }
};
const affectation = async (req, res, next) => {
    try {
        const { groups, idProg } = req.body.data;

        // Check if the necessary data is provided
        if (!idProg) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }
        // get all Student in our programme

        // find the student previos group
        const groupValues = Object.values(groups);

        groupValues.forEach(async (group) => {

            if (group.value === true) {
                const students = await db.student.findAll({
                    include: [
                        {
                            model: db.program,
                            as: 'programs',
                            attributes: ['ID_ROWID'],
                            where: {
                                ID_ROWID: idProg
                            }
                        },
                        {
                            model: db.groupe,
                            where: {
                                progID: idProg
                            },
                            required: false  // Make it optional
                        },
                    ]
                });
                //get student witout group
                const studentsWithoutGroup = students.filter(student => !student.groupe);
                let i = 0;
                let flag = false;

                studentsWithoutGroup.forEach((student) => {
                    if (!flag) {
                        db.studentGroup.create({
                            GroupeID: group.id,
                            StudentID: student.ID_ROWID
                        });

                        i = i + 1;

                        if (i >= group.take) {
                            flag = true;
                        }
                    }
                });


            }
        })

        return res.send({
            message: `The registration has been added successfully.`,

            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the registration.",
            error: error.message,
            code: 400
        });
    }
};
// Exporting the functions so they can be used elsewhere
module.exports = {
    addRegistration,
    removeRegistration,
    listRegistrations,
    ///
    listProgrammeRegistrations,
    updateRegistrationGroup,
    affectation
};