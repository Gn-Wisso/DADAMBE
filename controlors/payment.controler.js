const db = require(".././models");
const seq = require("sequelize");
const path = require('path');
const fs = require('fs');
const Fuse = require('fuse.js');
const op = seq.Op;
require("dotenv").config();

const addPayment = async (req, res, next) => {
    try {
        const { IDstudent, montant, Idprogram } = req.body.data;

        // Check if the necessary data is provided
        if (!IDstudent || !montant || !Idprogram) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }

        // Check if the student is registered for the program
        const existingRegistration = await db.registration.findOne({
            where: {
                StudentID: IDstudent,
                progID: Idprogram
            }
        });

        if (!existingRegistration) {
            return res.send({
                message: "Error! The student is not registered for this program.",
                code: 400
            });
        }
        // get type of payment 
        const prog = await db.program.findByPk(Idprogram, {
            attributes: ['typeOfPaiment']
        });
        if (prog && prog.typeOfPaiment === "Total") {// Check if the student has already made a payment for this program
            const existingPayment = await db.payment.findOne({
                where: {
                    StudentID: IDstudent,
                    progID: Idprogram
                }
            });

            if (existingPayment) {
                return res.send({
                    message: "This student has already made a payment for this program.",
                    code: 409
                });
            }
        }

        // Creating a new payment record in the database
        const newPayment = await db.payment.create({
            montant: montant,
            progID: Idprogram,
            StudentID: IDstudent
        });

        return res.send({
            message: `The payment has been added successfully.`,
            paymentId: newPayment.ID_ROWID,
            code: 200
        });

    } catch (error) {
        console.log(error);
        return res.send({
            message: "An error occurred while adding the payment.",
            error: error.message,
            code: 400
        });
    }
};


const removePayment = async (req, res, next) => {
    try {
        const paymentId = req.params.id;

        if (!paymentId) {
            return res.status(400).json({
                message: "Error! Payment ID is required for deletion.",
                code: 400
            });
        }

        const deletedPayment = await db.payment.destroy({
            where: { ID_ROWID: paymentId }
        });

        if (!deletedPayment) {
            return res.status(404).json({
                message: "Error! Payment not found.",
                code: 404
            });
        }

        return res.status(200).json({
            message: "Payment deleted successfully!",
            code: 200
        });

    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while deleting the payment.",
            error: error.message,
            code: 500
        });
    }
};

const listPayments = async (req, res, next) => {
    try {
        const payments = await db.payment.findAll({
            where: {
                StudentID: {
                    [op.ne]: null,
                }
            },
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

        if (!payments) {
            return res.send({
                message: "No payments found.",
                code: 404
            });
        }

        return res.send({
            message: "Payments fetched successfully.",
            payments: payments,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while fetching the payments.",
            error: error.message,
            code: 400
        });
    }
};

const getStudentsForProgramPayments = async (req, res, next) => {
    try {
        const programId = req.params.id;

        if (!programId) {
            return res.status(400).json({
                message: "Error! Program ID is required.",
                code: 400
            });
        }

        const payments = await db.payment.findAll({
            where: {
                progID: programId,
                '$StudentID$': { [db.Sequelize.Op.not]: null } // Filter out payments where the student ID is null
            },
            include: [{
                model: db.student,
                as: 'students',
                include: [{
                    model: db.person,
                    as: 'personProfile2',
                    attributes: ['firstName', 'lastName', 'mail', 'phoneNumber', 'dateOfBirth', 'imagePath']
                }]
            }]
        });

        if (!payments || payments.length === 0) {
            return res.status(404).json({
                message: "No valid payments found for the program.",
                code: 404
            });
        }

        // Modify the image paths in payments
        for (const payment of payments) {
            const student = payment.students; // Assuming there's only one student per payment
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

        return res.status(200).json({
            message: "Students with payments fetched successfully.",
            payments: payments,
            code: 200
        });

    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while fetching students for the program payments.",
            error: error.message,
            code: 500
        });
    }
};





const getTotalPaymentsForProgram = async (req, res, next) => {
    try {
        const programId = req.params.id;

        if (!programId) {
            return res.status(400).json({
                message: "Error! Program ID is required.",
                code: 400
            });
        }

        // Calculate the date 30 days ago from the current date
        const currentDate = new Date();
        const thirtyDaysAgo = new Date(currentDate);
        thirtyDaysAgo.setDate(currentDate.getDate() - 30);

        // Calculate total payments for the program
        const totalPayments = await db.payment.sum('montant', {
            where: {
                progID: programId
            }
        });

        // Calculate total payments made in the last 30 days
        const paymentsLast30Days = await db.payment.sum('montant', {
            where: {
                progID: programId,
                createdAt: {
                    [op.gte]: thirtyDaysAgo, // Payments made on or after 30 days ago
                    [op.lte]: currentDate // Payments made on or before the current date
                }
            }
        });

        return res.status(200).json({
            message: "Total payments and payments in the last 30 days fetched successfully.",
            totalPayments: totalPayments,
            paymentsLast30Days: paymentsLast30Days,
            code: 200
        });

    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while fetching payments information.",
            error: error.message,
            code: 500
        });
    }
};

module.exports = {
    addPayment,
    removePayment,
    listPayments,
    getStudentsForProgramPayments,
    getTotalPaymentsForProgram // Add this new method
};