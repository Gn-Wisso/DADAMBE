const db = require(".././models");
const seq = require("sequelize");
const op = seq.Op;
require("dotenv").config();

// Function to add a new group to the database
const addGroupe = async (req, res, next) => {
    try {
        const { GroupeName, capacity, teachers, progID } = req.body.data;

        // Check if the necessary data (group name) is provided
        if (!GroupeName) {
            return res.send({
                message: "Error! Group name is missing.",
                code: 400
            });
        }

        // Creating a new group record in the database
        const newGroupe = await db.groupe.create({
            GroupeName: GroupeName,
            capacity: capacity,
            progID: progID
        });
        if (teachers.length != 0) {
            teachers.map(async (id) => {
                await db.teacherGroup.create({
                    GroupeID: newGroupe.ID_ROWID,
                    TeacherID: id
                });
            });
        }
        return res.send({
            message: `Group '${GroupeName}' has been added successfully.`,
            groupId: newGroupe.ID_ROWID,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the group.",
            error: error.message,
            code: 400
        });
    }
};

// Function to remove a group from the database
const removeGroupe = async (req, res, next) => {
    try {
        const groupId = req.params.id; // Assuming the group ID is passed as a parameter in the URL

        if (!groupId) {
            return res.send({
                message: "Error! Group ID is required for deletion.",
                code: 400
            });
        }

        await db.groupe.destroy({
            where: { ID_ROWID: groupId }
        });

        return res.send({
            message: "Group deleted successfully!",
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while deleting the group.",
            error: error.message,
            code: 400
        });
    }
};
// Function to update a group in the database
const updateGroupe = async (req, res, next) => {
    try {
        const groupId = req.params.id; // Assuming the group ID is passed as a parameter in the URL
        const { GroupeName, capacity, teachers, progID } = req.body.data;

        if (!groupId) {
            return res.send({
                message: "Error! Group ID is required for updating.",
                code: 400
            });
        }

        await db.groupe.update({
            GroupeName: GroupeName,
            capacity: capacity
        }, {
            where: { ID_ROWID: groupId }
        });
        // delete all teachers assossiated to this group then add the new ones
        await db.teacherGroup.destroy({
            where: { GroupeID: groupId }
        });
        if (teachers.length != 0) {
            teachers.map(async (id) => {
                await db.teacherGroup.create({
                    GroupeID: groupId,
                    TeacherID: id
                });
            });
        }
        return res.send({
            message: "Group updated successfully!",
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while updating the group.",
            error: error.message,
            code: 400
        });
    }
};
// Programme Regestraions part
const listProgrammeGroups = async (req, res, next) => {
    try {
        const progId = req.body.progId;
        const groups = await db.groupe.findAll({
            where: {
                progID: progId
            },
            include: [
                {
                    model: db.teacher,
                    as: 'teachers',
                    include: [{
                        model: db.person,
                        as: 'personProfile2',
                        attributes: ['firstName', 'lastName']
                    }
                    ]
                },
                {
                    model: db.student,
                    as: 'students',
                    attributes: ['ID_ROWID']
                }

            ]
        });
        if (!groups) {
            return res.send({
                message: "No groups found.",
                code: 404
            });
        }

        return res.send({
            message: "Groups fetched successfully.",
            groups: groups,
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
// getAllGroups
const listGroups = async (req, res, next) => {
    try {
        const groups = await db.groupe.findAll();
        return res.send({
            message: "Groups fetched successfully.",
            groups: groups,
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
// Exporting the functions
module.exports = {
    addGroupe,
    removeGroupe,
    updateGroupe,
    listProgrammeGroups,
    listGroups
};