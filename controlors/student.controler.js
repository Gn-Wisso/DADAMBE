const db = require(".././models");
const seq = require("sequelize");
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Fuse = require('fuse.js');
require("dotenv").config();
const { addPerson } = require("./person.controler");
const { generateStudentCode, checkIfCodeExists } = require("./generator");

async function uploadFiles(files, idStudent) {
    const uploadedFiles = [];
    console.log(files);
    for (const file of files) {
        const { data, name } = file; // Assuming each file object has 'data' (Base64 data), 'type' (e.g., 'image/jpeg', 'application/pdf'), and 'name' properties
        const base64Data = data.split(';base64,').pop();
        const type = data.match(/^data:(.*?);/)[1];
        // Extract the file extension from the name
        const fileName = `${Date.now()}_${name}`;

        try {
            // Write the file to the uploads directory
            await fs.writeFile("uploads/studentsFiles/" + fileName, base64Data, { encoding: 'base64' },
                async (err) => {
                    if (err) {
                        console.error(err);

                    } else {
                        console.log('Image uploaded successfully');
                        // save the file name in document bd
                        await db.document.create({
                            documentName: fileName,
                            studentID: idStudent,
                            type: type

                        });
                    }
                });
        } catch (error) {
            console.error(`Error uploading ${name}:`, error);
        }
    }

    return uploadedFiles;
}
const addStudent = async (req, res, next) => {
    try {
        // get the data sent by the user request :
        // it has :
        // to create person :(firstName, lastName, mail, phoneNumber, dateOfBirth)
        // to create student we need to generat a code from his name and his date of birth
        const reqData = req.body.data;
        if (!reqData.levelID) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }
        const result = await addPerson(reqData);
        if (result.code === 400 || result.code === 409) {
            return res.send({
                message: "An error occurred",
                error: result.message,
                code: result.code,
            });
        }
        if (result.code === 401) {
            return res.send({
                message: "corrigez votre email",
                error: result.message,
                code: result.code,
            });
        }
        let generatedCode = generateStudentCode(reqData.firstName, reqData.lastName, reqData.dateOfBirth, reqData.email);

        // Check if the generated code exists, if yes, then keep generating a new one until it's unique
        while (await checkIfCodeExists(generatedCode)) {
            // Alter the generated code in some way to ensure uniqueness. This could be adding a random number, or using another mechanism.
            // For this example, I'm simply appending a random number to it. 
            // You might want to modify the generateStudentCode function or come up with a different mechanism for this.
            generatedCode = generateStudentCode(reqData.firstName, reqData.lastName, reqData.dateOfBirth, reqData.email) + Math.floor(Math.random() * 1000);
        }

        // create the student 
        const createdStudent = await db.student.create({
            studentCode: generatedCode,
            personId: result,
            isActive: "Active"
        })
        // create student level
        await db.studentLevel.create({
            studentID: createdStudent.ID_ROWID,
            levelID: reqData.levelID,
            yearID: reqData.yearID
        });
        await uploadFiles(reqData.files, createdStudent.ID_ROWID);
        return res.send({
            message: "This user has been added successfully to Your list of student",
            studentId: createdStudent.ID_ROWID,
            code: 200,
        });
    } catch (error) {

        res.send({
            message: "An error occurred",
            error: error.message,
            code: 400,
        });
        throw error;
    }
}
const updateStudent = async (req, res, next) => {
    try {
        const data = req.body.data;  // Extracting the data object directly
        const sudentid = req.params.id;
        // Check if studentID is provided
        if (!sudentid) {
            return res.send({
                message: "Error! StudentID is required for updating.",
                code: 400
            });
        }
        // find if there is already an exicted profile with the same mail

        // Get the personId for the student
        const studentRecord = await db.student.findOne({
            where: { ID_ROWID: sudentid },

            include: [{
                model: db.person,
                as: 'personProfile2'
            }]
        });
        const oldImageName = studentRecord.personProfile2.imagePath;
        // delete old image if it exicte 
        if (oldImageName != null && oldImageName != "") {
            // Delete the existing image file (if it exists)
            const existingImagePath = path.join("uploads/profileImage/", oldImageName);
            if (fs.existsSync(existingImagePath)) {
                fs.unlinkSync(existingImagePath);
            }
        }
        let imagePath = '';
        if (data.image) {
            // Decode the Base64-encoded image data
            const base64Image = data.image.split(';base64,').pop();
            imagePath = `${data.firstName}_${Date.now()}.jpg`;

            await fs.writeFile("uploads/profileImage/" + imagePath, base64Image, { encoding: 'base64' }, (err) => {
                if (err) {
                    console.error(err);

                } else {
                    console.log('Image uploaded successfully');
                    // Now, you can do whatever you want with the image.
                }
            });

        }
        // delete old fils
        const oldFiles = await db.document.findAll({
            where: { studentID: sudentid }
        });
        const documents = Object.values(oldFiles);
        for (const doc of documents) {
            const pathName = path.join("uploads/studentsFiles/", doc.documentName);
            try {
                if (fs.existsSync(pathName)) {
                    fs.unlinkSync(pathName);
                }
            } catch (error) {
                console.error(error);
            }
        }
        await db.document.destroy({
            where: { studentID: sudentid }
        });
        // uploud new files
        await uploadFiles(data.files, sudentid);
        // Now update the person using the personId from the student record
        try {
            await db.person.update({
                firstName: data.firstName,
                lastName: data.lastName,
                mail: data.mail,
                phoneNumber: data.phoneNumber,
                dateOfBirth: data.dateOfBirth,
                imagePath: imagePath
            }, {
                where: { ID_ROWID: studentRecord.personId }
            });
            // If the update is successful, proceed with any necessary logic
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                // Handle the unique constraint violation error (e.g., duplicate mail)
                // You can log the error, notify the user, or perform any necessary actions
                return res.send({
                    message: "Erreur: L'email est déjà utilisé.",
                    code: 400
                });              // You might want to return or throw the error to handle it appropriately
            } else {
                // Handle other types of errors, if needed
                return res.send({
                    message: "Error updating record.",
                    code: 400
                });
                // You might want to return or throw the error to handle it appropriately
            }
        }
        await db.student.update({
            isActive: data.status
        }, {
            where: { ID_ROWID: sudentid }
        });
        // update student educ level
        await db.studentLevel.update({
            levelID: data.levelID,
            yearID: data.yearID
        }, {
            where: { studentID: sudentid }
        })
        return res.send({
            message: `Student '${data.firstName} ${data.lastName}' has been updated successfully.`,
            code: 200
        });

    } catch (error) {
        console.log(error);
        return res.send({
            message: "An error occurred while updating the student.",
            error: error.message,
            code: 400
        });
    }
};
const removeStudent = async (req, res, next) => {
    try {
        const studentID = req.params.id;

        // Validation: Ensure a studentID was provided
        if (!studentID) {
            return res.send({
                message: "Error! Student ID must be provided.",
                code: 400
            });
        }

        // Fetch the student
        const student = await db.student.findByPk(studentID, {
            include: [{
                model: db.person,
                as: 'personProfile2'
            }]
        });
        if (!student) {
            return res.send({
                message: "Error! Student not found.",
                code: 404
            });
        }
        const oldImageName = student.personProfile2.imagePath;
        // delete old image if it exicte 
        if (oldImageName != null && oldImageName != "") {
            // Delete the existing image file (if it exists)
            const existingImagePath = path.join("uploads/profileImage/", oldImageName);
            if (fs.existsSync(existingImagePath)) {
                fs.unlinkSync(existingImagePath);
            }
        }
        // Remove the associated person from the database
        await db.person.destroy({
            where: { ID_ROWID: student.personId }
        });

        // Remove the student from the database
        await db.student.destroy({
            where: { ID_ROWID: studentID }
        });
        //in order words i delete both student and person 
        // Return success message
        return res.send({
            message: "Student removed successfully.",
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while removing the student.",
            error: error.message,
            code: 400
        });
    }
};
const listStudents = async (req, res, next) => {
    try {
        // Fetching all students from the database
        const students = await db.student.findAll({
            include: [ // Assuming you want to also fetch the associated person details for each student
                {
                    model: db.person,
                    as: 'personProfile2',  // Alias you set in associations
                    attributes: ['firstName', 'lastName', 'mail', 'phoneNumber', 'dateOfBirth', 'imagePath'] // specify the attributes you want
                },
                {
                    model: db.studentLevel,
                    include: [ // Assuming you want to also fetch the associated person details for each student
                        {
                            model: db.educationalLevel,
                        },
                        {
                            model: db.studyYear,
                            required: false
                        },
                    ]
                },

            ]
        });
        for (const user of students) {
            if (user.personProfile2.imagePath != null || user.personProfile.imagePath != '') {
                const photoPath = path.join("uploads/profileImage/", user.personProfile2.imagePath); // get the photo file path
                try {
                    await fs.promises.access(photoPath, fs.constants.F_OK); // check if the file exists
                    user.personProfile2.imagePath = await fs.promises.readFile(photoPath); // read the photo file contents
                } catch (error) {
                    console.error(error);
                    user.personProfile2.imagePath = null;
                }
            }
        }
        console.log(students);
        // Return the list of students
        return res.send({
            message: "List of all students",
            students: students,
            code: 200
        });

    } catch (error) {
        console.log(error);
        return res.send({
            message: "An error occurred while fetching the list of students.",
            error: error.message,
            code: 400
        });
    }
};
const ExploreSearch = async (req, res, next) => {
    try {
        const findKey = req.body.Key;

        if (!findKey) {
            return res.send({
                message: "No search key provided.",
                students: null,
                code: 200
            });
        }

        // Fetch all students with their associated person details
        const itemsForSearching = await db.student.findAll({
            attributes: ['studentCode'],
            include: [{
                model: db.person,
                as: 'personProfile2',
                attributes: ['firstName', 'lastName', 'mail', 'phoneNumber', 'dateOfBirth']
            }]
        });

        // Setup the options for Fuse
        const options = {
            includeScore: true,
            keys: ['personProfile2.firstName', 'personProfile2.lastName', 'personProfile2.mail', 'personProfile2.phoneNumber']
        };

        const fuse = new Fuse(itemsForSearching, options);
        const result = fuse.search(findKey);

        // Extract the items from the Fuse result
        const filteredItems = result.map(item => item.item.toJSON());
        return res.send({
            message: "Search results",
            students: filteredItems,
            code: 200
        });
        // Return the filtered items

    } catch (error) {
        return res.send({
            message: "An error occurred during the search.",
            error: error.message,
            code: 400
        });
    }
};


const getStudentHistory = async (req, res, next) => {
    try {
        const id = req.body.id;
        if (!id) {
            return res.send({
                message: "the id undefined",
                code: 400,
            });
        }
        // get the user 
        const userStudent = await db.student.findByPk(id, {
            attributes: ['ID_ROWID', 'createdAt'],
            include: {
                model: db.groupe, // Corrected model name
                attributes: ['ID_ROWID', 'GroupeName'],
                // Include additional nested associations if needed
                include: {
                    model: db.program,
                    attributes: ['ID_ROWID', 'title'],
                },
                required: false // Use 'required: false' for a LEFT JOIN-like behavior
            }
        });

        if (userStudent) {
            // Here, 'userStudent' will contain the student details and associated group data
            console.log(userStudent.toJSON());
        } else {
            console.log('Student not found');
        }

        if (!userStudent) {

            return res.send({
                message: "the user unfind",
                code: 400,
            });
        }
        // find list of subscibs for the user 
        const listOfUserSubscrib = await db.registration.findAll({
            where: {
                StudentID: id
            },
            include: [{
                model: db.program,
                attributes: ['ID_ROWID', 'title'],
                as: 'programs'
            }]
        });
        // get list of last payment user made
        const paymentList = await db.payment.findAll({
            StudentID: id,
            include: [{
                model: db.program,
                attributes: ['ID_ROWID', 'title'],
                as: 'programs'
            }]
        });
        // get list of last activity in bieng in a group
        const listStudentGroup = userStudent.groupes;
        // Merging and formatting data into the required list format
        const mergedList = [];
        mergedList.push({
            id: 1,
            title: "Création De Compte",
            date: userStudent.createdAt, // Assuming subscriptions have a createdAt field
            type: 'AccountCreation',
            logo: 'brand-logo-1.svg'
        })
        var i = 2;
        await listStudentGroup.forEach(groupe => {
            mergedList.push({
                id: i,
                title: "S'inscrire dans le groupe " + groupe.GroupeName + " de programme " + groupe.program.title,
                date: groupe.studentGroup.createdAt, // Assuming subscriptions have a createdAt field
                type: 'groupSubscription', // Assuming this is the type for subscriptions
                logo: 'brand-logo-4.svg',
                progID: groupe.program.ID_ROWID
            });
            i++;
        });
        await listOfUserSubscrib.forEach(subscription => {
            mergedList.push({
                id: i,
                title: "S'abonner au programme " + subscription.programs.title,
                date: subscription.createdAt, // Assuming subscriptions have a createdAt field
                type: 'subscription', // Assuming this is the type for subscriptions
                logo: 'brand-logo-2.svg',
                progID: subscription.programs.ID_ROWID
            });
            i++;
        });

        await paymentList.forEach(payment => {
            mergedList.push({
                id: i,
                title: "Payez " + payment.montant + " DA pour le programme " + payment.programs.title,
                date: payment.createdAt, // Assuming payments have a createdAt field
                type: 'payment', // Assuming this is the type for payments
                logo: 'brand-logo-3.svg',
                progID: payment.programs.ID_ROWID
            });
            i++;
        });
        res.send({
            message: "succes",
            mergedList: mergedList,
            code: 200,
        });
    } catch (error) {
        console.log(error);
        res.send({
            message: "An error occurred",
            error: error.message,
            code: 400,
        });
        throw error;
    }
}

const getStudentData = async (req, res, next) => {
    try {
        const id = req.body.id;
        if (!id) {
            return res.send({
                message: "the id undefined",
                code: 400,
            });
        }
        // get the user 
        const userStudent = await db.student.findByPk(id, {
            include: [{
                model: db.person,
                as: 'personProfile2'
            },
            {
                model: db.studentLevel,
                include: [ // Assuming you want to also fetch the associated person details for each student
                    {
                        model: db.educationalLevel,
                    },
                    {
                        model: db.studyYear,
                        required: false
                    },
                ]
            }, {
                model: db.document,
                required: false
            },
            ]
        });
        const files = [];
        const documents = Object.values(userStudent.documents);

        for (const doc of documents) {
            const pathName = path.join("uploads/studentsFiles/", doc.documentName);
            try {
                await fs.promises.access(pathName, fs.constants.F_OK);
                const data = await fs.promises.readFile(pathName);
                files.push({ "data": data, "name": doc.documentName, "type": doc.type });
            } catch (error) {
                console.error(error);
            }
        }

        console.log(files);
        // Process the image if it exists

        if (userStudent.personProfile2.imagePath) {
            const photoPath = path.join("uploads/profileImage/", userStudent.personProfile2.imagePath);
            try {
                await fs.promises.access(photoPath, fs.constants.F_OK);
                userStudent.personProfile2.imagePath = await fs.promises.readFile(photoPath); // read the photo file contents
            } catch (error) {
                console.error(error);
                userStudent.personProfile2.imagePath = null;
            }
        }

        res.send({
            message: "succes",
            student: userStudent,
            files: files,
            code: 200,
        });
    } catch (error) {
        console.log(error);
        res.send({
            message: "An error occurred",
            error: error.message,
            code: 400,
        });
        throw error;
    }
}
module.exports = {
    addStudent,
    updateStudent,
    removeStudent,
    listStudents,
    ExploreSearch,
    getStudentHistory,
    getStudentData
};
