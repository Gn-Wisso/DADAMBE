const db = require(".././models");
const seq = require("sequelize");
const op = seq.Op;
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Fuse = require('fuse.js');
require("dotenv").config();
const { addPerson } = require("./person.controler");
const { generateStudentCode, checkIfCodeExistsT } = require("./generator");

const addTeacher = async (req, res, next) => {
    try {
        // get the data sent by the user request :
        // it has :
        // to create person :(firstName, lastName, mail, phoneNumber, dateOfBirth)
        // to create student we need to generat a code from his name and his date of birth
        const reqData = req.body.data;
        const result = await addPerson(reqData);
        if (result.code === 400 || result.code === 409) {
            return res.send({
                message: "An error occurred",
                error: result.message,
                code: result.code,
            });
        }
        const suject = reqData.subject;
        // generat student code : an unique id we use to reference to the student but for security reason we do not use it as a table primary key
        // student code is available for others to see 
        // primary key is not available 
        let generatedCode = generateStudentCode(reqData.firstName, reqData.lastName, reqData.dateOfBirth, reqData.email);

        // Check if the generated code exists, if yes, then keep generating a new one until it's unique
        while (await checkIfCodeExistsT(generatedCode)) {
            // Alter the generated code in some way to ensure uniqueness. This could be adding a random number, or using another mechanism.
            // For this example, I'm simply appending a random number to it. 
            // You might want to modify the generateStudentCode function or come up with a different mechanism for this.
            generatedCode = generateStudentCode(reqData.firstName, reqData.lastName, reqData.dateOfBirth, reqData.email) + Math.floor(Math.random() * 1000);
        }
        // find a way to create it using user first & last name , date of birth , the actual date 
        /******* */

        // create the student 
        await db.teacher.create({
            TeacherID: generatedCode,
            personId: result,
            subject: suject
        })
        return res.send({
            message: "This user has been added successfully to Your list of teachers",
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
const updateTeacher = async (req, res, next) => {
    try {
        const data = req.body.data;
        const teacherId = req.params.id;

        if (!teacherId) {
            return res.send({
                message: "Error! TeacherID is required for updating.",
                code: 400
            });
        }

        const teacherRecord = await db.teacher.findOne({
            where: { ID_ROWID: teacherId },
            include: [{
                model: db.person,
                as: 'personProfile2'
            }]
        });
        const oldImageName = teacherRecord.personProfile2.imagePath;
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
        try {
            await db.person.update({
                firstName: data.firstName,
                lastName: data.lastName,
                mail: data.mail,
                phoneNumber: data.phoneNumber,
                dateOfBirth: data.dateOfBirth,
                imagePath: imagePath
            }, {
                where: { ID_ROWID: teacherRecord.personId }
            });
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
        // Now update teacher-specific details
        await db.teacher.update({
            subject: data.subject
        }, {
            where: { ID_ROWID: teacherId }
        });

        return res.send({
            message: `Teacher '${data.firstName} ${data.lastName}' has been updated successfully.`,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while updating the teacher.",
            error: error.message,
            code: 400
        });
    }
};

const removeTeacher = async (req, res, next) => {
    try {
        const teacherID = req.params.id;

        if (!teacherID) {
            return res.send({
                message: "Error! Teacher ID must be provided.",
                code: 400
            });
        }

        const teacher = await db.teacher.findByPk(teacherID, {
            include: [{
                model: db.person,
                as: 'personProfile2'
            }]
        });
        if (!teacher) {
            return res.send({
                message: "Error! Teacher not found.",
                code: 404
            });
        }
        const oldImageName = teacher.personProfile2.imagePath;
        // delete old image if it exicte 
        if (oldImageName != null && oldImageName != "") {
            // Delete the existing image file (if it exists)
            const existingImagePath = path.join("uploads/profileImage/", oldImageName);
            if (fs.existsSync(existingImagePath)) {
                fs.unlinkSync(existingImagePath);
            }
        }
        await db.person.destroy({
            where: { ID_ROWID: teacher.personId }
        });

        await db.teacher.destroy({
            where: { ID_ROWID: teacherID }
        });

        return res.send({
            message: "Teacher removed successfully.",
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while removing the teacher.",
            error: error.message,
            code: 400
        });
    }
};
const listTeachers = async (req, res, next) => {
    try {
        // Fetching all teachers from the database
        const teachers = await db.teacher.findAll({
            include: [
                {
                    model: db.person,
                    as: 'personProfile2',  // Alias you set in associations
                    attributes: ['firstName', 'lastName', 'mail', 'phoneNumber', 'dateOfBirth', 'imagePath']
                }
            ]
        });

        for (const teacher of teachers) {
            if (teacher.personProfile2.imagePath != null || teacher.personProfile2.imagePath != '') {
                const photoPath = path.join("uploads/profileImage/", teacher.personProfile2.imagePath); // get the photo file path
                try {
                    await fs.promises.access(photoPath, fs.constants.F_OK); // check if the file exists
                    teacher.personProfile2.imagePath = await fs.promises.readFile(photoPath); // read the photo file contents
                } catch (error) {
                    console.error(error);
                    teacher.personProfile2.imagePath = null;
                }
            }
        }
        console.log(teachers);

        // Return the list of teachers
        return res.send({
            message: "List of all teachers",
            teachers: teachers,
            code: 200
        });

    } catch (error) {
        console.log(error);
        return res.send({
            message: "An error occurred while fetching the list of teachers.",
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
                message: "we can't get any information about search",
                teachers: null,
                code: 200
            });
        }

        const itemsForSearching = await db.teacher.findAll({
            attributes: ['TeacherID', 'subject'],
            include: {
                model: db.person,
                as: "personProfile2",
                attributes: ['firstName', 'lastName', 'mail', 'phoneNumber', 'dateOfBirth']
            }
        });

        const options = {
            includeScore: true,
            keys: ['personProfile2.firstName', 'personProfile2.lastName', 'personProfile2.mail', 'personProfile2.phoneNumber', 'subject']
        };

        const fuse = new Fuse(itemsForSearching, options);
        const result = fuse.search(findKey);
        const filteredItems = result.map(item => item.item.toJSON());
        return res.send({
            message: "Search results",
            teachers: filteredItems,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred during search",
            error: error.message,
            code: 500
        });
    }
};

// teachers list for create group
const listTeachersForGroup = async (req, res, next) => {
    try {
        // Fetching all teachers from the database
        const teachers = await db.teacher.findAll({
            include: [
                {
                    model: db.person,
                    as: 'personProfile2',  // Alias you set in associations
                    attributes: ['firstName', 'lastName']
                }
            ],
            attributes: ['ID_ROWID']
        });

        console.log(teachers);

        // Return the list of teachers
        return res.send({
            message: "List of all teachers",
            teachers: teachers,
            code: 200
        });

    } catch (error) {
        console.log(error);
        return res.send({
            message: "An error occurred while fetching the list of teachers.",
            error: error.message,
            code: 400
        });
    }
};

const getTeacherData = async (req, res, next) => {
    try {
        const id = req.body.id;
        if (!id) {
            return res.send({
                message: "the id undefined",
                code: 400,
            });
        }
        // Get the teacher 
        const userTeacher = await db.teacher.findByPk(id, {
            include: [{
                model: db.person,
                as: 'personProfile2'
            },
          /*  {
                model: db.document,
                required: false
            },*/
            ]
        });
    /*    const files = [];
        const documents = Object.values(userTeacher.documents);

        for (const doc of documents) {
            const pathName = path.join("uploads/teacherFiles/", doc.documentName);
            try {
                await fs.promises.access(pathName, fs.constants.F_OK);
                const data = await fs.promises.readFile(pathName);
                files.push({ "data": data, "name": doc.documentName, "type": doc.type });
            } catch (error) {
                console.error(error);
            }
        }

        console.log(files);*/
        // Process the image if it exists

        if (userTeacher.personProfile2.imagePath) {
            const photoPath = path.join("uploads/profileImage/", userTeacher.personProfile2.imagePath);
            try {
                await fs.promises.access(photoPath, fs.constants.F_OK);
                userTeacher.personProfile2.imagePath = await fs.promises.readFile(photoPath); // read the photo file contents
            } catch (error) {
                console.error(error);
                userTeacher.personProfile2.imagePath = null;
            }
        }

        res.send({
            message: "success",
            teacher: userTeacher,
          //  files: files,
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
    addTeacher,
    updateTeacher,
    removeTeacher,
    listTeachers,
    ExploreSearch,
    listTeachersForGroup,
    getTeacherData
};


// const removeWorker = async (req, res, next) => {
//     try {
//         const { userID } = req.body;
//         // workerID the one we find by his email

//         if (!userID) {
//             return res.send({
//                 message: "error no data has been sent",
//                 code: 500,
//             });
//         }
//         await db.Workers.destroy({
//             where: {
//                 MWUID: userID,
//             },
//         });
//         const user = await db.Users.findByPk(userID);
//         user.is_staff = false;
//         user.save();

//         return res.send({
//             message:
//                 "This user has been Remove successfully from Your list of workers",
//             code: 200,
//         });
//     } catch (error) {
//         res.send({
//             message: "An error occurred",
//             error: error.message,
//             code: 400,
//         });
//         throw error;
//     }
// };
// // remove worker
