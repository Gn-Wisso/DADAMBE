const db = require(".././models");
const seq = require("sequelize");
const op = seq.Op;
require("dotenv").config();

// Function to add a new program to the database
const addProgram = async (req, res, next) => {
    try {
        // Extract the data sent by the user request
        const { title, discription, categID, type, isSkip, isPublished, prix, typeOfPaiment } = req.body.dataProgram;
        // Check if the title is provided
        if (!title || !type) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }

        // Create a new program record in the database
        const program = await db.program.create({
            title: title,
            discription: discription,
            type: type,
            isSkiped: isSkip,
            categID: categID,
            isPublished: isPublished,
            prix: prix,
            typeOfPaiment: typeOfPaiment,
            PublishedDate: isPublished ? Date.now() : null,
        });
        if (!isSkip) {
            if (type == "formation") {
                const { startDay, endDay, inscriptionEndDay, isLimited, nbrParticipat } = req.body.dataType
                const formation = await db.formation.create({
                    startDate: startDay,
                    endDate: endDay,
                    isLimited: isLimited,
                    nbrStudent: nbrParticipat,
                    progId: program.ID_ROWID
                });
                program.EndInsciptionDate = inscriptionEndDay;
                program.save();
            }
            else if (type == "cour") {
                const { inscriptionEndDay, nbrSession, hoursBySession } = req.body.dataType
                const cour = await db.cour.create({
                    sessionTiming: hoursBySession,
                    sessionsNumber: nbrSession,
                    progId: program.ID_ROWID
                });
                program.EndInsciptionDate = inscriptionEndDay;
                program.save();
            }
            else if (type == "activity") {
                const { timing, type, ageGroup, emplacement } = req.body.dataType
                await db.activity.create({
                    timing: timing,
                    type: type,
                    ageGroup: ageGroup,
                    emplacement: emplacement,
                    progId: program.ID_ROWID
                });
                program.EndInsciptionDate = inscriptionEndDay;
                program.save();
            }
            else if (type == "workshop") {
                const { startDate, endDate, isLimited, nbrStudent, Materials } = req.body.dataType
                await db.workshop.create({
                    startDate: startDate,
                    endDate: endDate,
                    isLimited: isLimited,
                    nbrStudent: nbrStudent,
                    Materials: Materials,
                    progId: program.ID_ROWID
                });
                program.EndInsciptionDate = inscriptionEndDay;
                program.save();
            }
        }
        // Return a success message along with the ID of the newly created program
        return res.send({
            message: `Program '${title}' has been added successfully.`,
            programId: program.ID_ROWID,
            code: 200
        });

    } catch (error) {
        console.log(error);
        return res.send({
            message: "An error occurred while adding the program.",
            error: error.message,
            code: 400
        });
    }
};

const updateProgram = async (req, res, next) => {

    try {
        const programId = req.params.id;
        // Extract the data sent by the user request
        const { title, discription, categID, type, isSkip, isPublished, prix, typeOfPaiment } = req.body.dataProgram;
        // Check if the title is provided
        if (!title || !type) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }
        // find programme
        const programData = await db.program.findByPk(programId, {
            include: [
                {
                    model: db.formation,
                },
                {
                    model: db.cour,
                },
                {
                    model: db.activity,
                },
                {
                    model: db.workshop,
                },
            ]
        });
        if (!programData.isSkiped) {
            if (programData.type == "formation" && programData.formation) {
                await db.formation.destroy({
                    where: { ID_ROWID: programData.formation.ID_ROWID }
                });
                programData.formation = null;
            }
            else if (programData.type == "cour" && programData.cour) {
                await db.cour.destroy({
                    where: { ID_ROWID: programData.cour.ID_ROWID }
                });
                programData.cour = null;
            }
            else if (programData.type == "activity" && programData.activity) {
                await db.activity.destroy({
                    where: { ID_ROWID: programData.activity.ID_ROWID }
                });
                programData.activity = null;
            }
            else if (programData.type == "workshop" && programData.workshop) {
                await db.workshop.destroy({
                    where: { ID_ROWID: programData.workshop.ID_ROWID }
                });
                programData.workshop = null;
            }
        }

        // update program record in the database
        programData.title = title,
            programData.discription = discription,
            programData.type = type,
            programData.isSkiped = isSkip,
            programData.categID = categID,
            programData.isPublished = isPublished,
            programData.PublishedDate = isPublished ? Date.now() : null,
            programData.prix = prix;
        programData.typeOfPaiment = typeOfPaiment;
        programData.save();
        if (!isSkip) {
            if (type == "formation") {
                const { startDay, endDay, inscriptionEndDay, isLimited, nbrParticipat } = req.body.dataType
                await db.formation.create({
                    startDate: startDay,
                    endDate: endDay,
                    isLimited: isLimited,
                    nbrStudent: nbrParticipat,
                    progId: programData.ID_ROWID
                });
                programData.EndInsciptionDate = inscriptionEndDay;
                programData.save();
            }
            else if (type == "cour") {
                const { inscriptionEndDay, nbrSession, hoursBySession } = req.body.dataType
                await db.cour.create({
                    sessionTiming: hoursBySession,
                    sessionsNumber: nbrSession,
                    progId: programData.ID_ROWID
                });
                programData.EndInsciptionDate = inscriptionEndDay;
                programData.save();
            }
            else if (type == "activity") {
                const { timing, type, ageGroup, emplacement } = req.body.dataType
                await db.activity.create({
                    timing: timing,
                    type: type,
                    ageGroup: ageGroup,
                    emplacement: emplacement,
                    progId: programData.ID_ROWID
                });
                programData.EndInsciptionDate = inscriptionEndDay;
                programData.save();
            }
            else if (type == "workshop") {
                const { startDate, endDate, isLimited, nbrStudent, Materials } = req.body.dataType
                await db.workshop.create({
                    startDate: startDate,
                    endDate: endDate,
                    isLimited: isLimited,
                    nbrStudent: nbrStudent,
                    Materials: Materials,
                    progId: programData.ID_ROWID
                });
                programData.EndInsciptionDate = inscriptionEndDay;
                programData.save();
            }
        }
        // Return a success message along with the ID of the newly created program
        return res.send({
            message: `Program '${title}' has been updated successfully.`,
            program: programData,
            code: 200
        });

    } catch (error) {
        console.log(error);
        return res.send({
            message: "An error occurred while adding the program.",
            error: error.message,
            code: 400
        });
    }
};


const removeProgram = async (req, res, next) => {
    try {
        const programId = req.params.id;

        const programme = await db.program.findByPk(programId);
        if (programme) {
            // Delete payments associated with the program
            await db.payment.destroy({
                where: { progID: programId }
            });

            if (programme.type == "formation") {
                await db.formation.destroy({
                    where: { progID: programId }
                })
            } else if (programme.type == "cour") {
                await db.cour.destroy({
                    where: { progID: programId }
                })
            }
            else if (programme.type == "activity") {
                await db.activity.destroy({
                    where: { progID: programId }
                })
            }
            else if (programme.type == "workshop") {
                await db.workshop.destroy({
                    where: { progID: programId }
                })
            }
        }
        // Delete the program record from the database
        await db.program.destroy({
            where: { ID_ROWID: programId }
        })
        return res.send({
            message: `Program with ID: ${programId} has been removed successfully.`,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while removing the program.",
            error: error.message,
            code: 400
        });
    }
};
const getPrograms = async (req, res, next) => {
    try {
        // Delete the program record from the database
        const programs = await db.program.findAll({
            include: {
                model: db.categorie,
                as: 'categorie',
                attributes: ['ID_ROWID', 'title']
            }
        })
        return res.send({
            message: 'Request succeed',
            programs: programs,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while fetching the programs.",
            error: error.message,
            code: 400
        });
    }
};
const getProgram = async (req, res, next) => {
    try {
        const programId = req.params.id;  // Assuming the category ID is passed as a parameter in the URL
        console.log(programId);
        // Check if category ID is provided
        if (!programId) {
            return res.send({
                message: "Error! Programme ID is required for updating.",
                code: 400
            });
        }
        // get programme data
        const program = await db.program.findByPk(programId,
            {
                include: {
                    model: db.categorie,
                    as: 'categorie',
                    attributes: ['ID_ROWID', 'title']
                },
            });
        let data;
        if (program.type == "formation") {
            const progWithFormation = await db.program.findByPk(programId, {
                include: [
                    {
                        model: db.formation,
                    }
                ]
            });
            data = progWithFormation.formation;
        }
        else if (program.type == "cour") {
            const progWithCour = await db.program.findByPk(programId, {
                include: [
                    {
                        model: db.cour,
                    }
                ]
            });
            data = progWithCour.cour;
        }
        else if (program.type == "activity") {
            const progWithCour = await db.program.findByPk(programId, {
                include: [
                    {
                        model: db.activity,
                    }
                ]
            });
            data = progWithCour.activity;
        }
        else if (program.type == "workshop") {
            const progWithCour = await db.program.findByPk(programId, {
                include: [
                    {
                        model: db.workshop,
                    }
                ]
            });
            data = progWithCour.workshop;
        }
        return res.send({
            message: `fetch Data avec succes`,
            program: program,
            data: data,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while updating the category.",
            error: error.message,
            code: 400
        });
    }
};

const findNonSkippedPrograms = async (req, res, next) => {
    try {
        const nonSkippedPrograms = await db.program.findAll({
            where: {
                isSkiped: false
            }
        });

        return res.send({
            message: "List of non-skipped programs.",
            programs: nonSkippedPrograms,
            code: 200
        });
    } catch (error) {
        return res.send({
            message: "An error occurred while fetching non-skipped programs.",
            error: error.message,
            code: 400
        });
    }
};

const listRegistrablePrograms = async (req, res, next) => {
    try {
        const currentDate = new Date();

        const registrablePrograms = await db.program.findAll({
            where: {
                isSkiped: false,
                // PublishedDate: {
                //     [op.lt]: currentDate  // less than current date
                // },
                EndInsciptionDate: {
                    [op.gt]: currentDate  // greater than current date
                }
            }
        });

        return res.send({
            message: "List of registrable programs.",
            programs: registrablePrograms,
            code: 200
        });
    } catch (error) {
        return res.send({
            message: "An error occurred while fetching registrable programs.",
            error: error.message,
            code: 400
        });
    }
};


module.exports = {
    addProgram,
    updateProgram,
    removeProgram,
    getProgram,
    getPrograms,
    findNonSkippedPrograms,  // added
    listRegistrablePrograms  // added
};

