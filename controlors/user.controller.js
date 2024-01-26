const db = require(".././models");
const seq = require("sequelize");
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
require("dotenv").config();
const { addPerson } = require("./person.controler");
const { generateUniqueUsername } = require("./generator");
const sendM = require("./email.controler");
const passwordGenerator = require("password-generator");
function sendPassword(firstName, last_name, password, email) {
    const subject = "Your Account Is Created Successfully";
    sendM.sendEmail(email, subject, {
        Fname: firstName + " " + last_name,
        Message:
            "Your account user in our Platform  has been created. Please Log in by this password :" +
            password +
            " .",
        Url: null,
    });
}
// add worker in defrent roles (admin, secretary)
const addUser = async (req, res, next) => {
    try {
        // get the data sent by the user request :
        // it has :
        // to create person :(firstName, lastName, mail, phoneNumber, dateOfBirth)
        // to create user we need to generat a code from his name and his date of birth
        const reqData = req.body.data;
        const result = await addPerson(reqData);
        if (result.code === 400 || result.code === 409) {
            return res.send({
                message: "An error occurred",
                error: result.message,
                code: result.code,
            });
        }
        // create a user name :
        const username = generateUniqueUsername(reqData.firstName, reqData.lastName);
        /******* */
        // generate pasword 
        const password = passwordGenerator(8, false);
        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // create the user 
        await db.user.create({
            UserName: username,
            role: reqData.role,
            Password: hashedPassword,
            personId: result
        });
        await sendPassword(reqData.firstName, reqData.lastName, password, reqData.mail);
        return res.send({
            message: "This user has been added successfully to Your list of user",
            code: 200,
        });
    } catch (error) {
        return res.send({
            message: "An error occurred",
            error: error.message,
            code: 400,
        });

    }
}
// lister the workers
const getAllUsers = async (req, res, next) => {
    try {
        const allUsers = await db.user.findAll({
            attributes: ['ID_ROWID', 'isConnected', 'role'],
            include: [{
                model: db.person,
                as: 'personProfile'
            }]
        });
        for (const user of allUsers) {
            console.log(user.personProfile.mail);
            if (user.personProfile.imagePath && user.personProfile.imagePath != '') {
                const photoPath = path.join("uploads/profileImage/", user.personProfile.imagePath); // get the photo file path
                try {
                    await fs.promises.access(photoPath, fs.constants.F_OK); // check if the file exists
                    user.personProfile.imagePath = await fs.promises.readFile(photoPath); // read the photo file contents
                } catch (error) {
                    console.error(error);
                    user.personProfile.imagePath = null;
                }
            }
        }
        return res.send({
            message: "Usrs list",
            allUsers: allUsers,
            code: 200,
        });
    } catch (error) {
        console.log(error);
        return res.send({
            message: "An error occurred",
            error: error.message,
            code: 400,
        });

    }
}
// drop user
const removeUser = async (req, res, next) => {
    try {
        const userID = req.params.id;

        // Validation: Ensure a userID was provided
        if (!userID) {
            return res.send({
                message: "Error! user ID must be provided.",
                code: 400
            });
        }

        // Fetch the user
        const user = await db.user.findByPk(userID, {
            include: [{
                model: db.person,
                as: 'personProfile'
            }]
        });
        if (!user) {
            return res.send({
                message: "Error! user not found.",
                code: 404
            });
        }
        const oldImageName = user.personProfile.imagePath;
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
            where: { ID_ROWID: user.personId }
        });

        // Remove the user from the database
        await db.user.destroy({
            where: { ID_ROWID: userID }
        });
        //in order words i delete both user and person 
        // Return success message
        return res.send({
            message: "user removed successfully.",
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while removing the user.",
            error: error.message,
            code: 400
        });
    }
};
const ExploreSearchUsers = async (req, res, next) => {
    try {
        const findKey = req.params.Key;

        if (!findKey) {
            return res.send({
                message: "No search key provided.",
                students: null,
                code: 200
            });
        }

        // Fetch all students with their associated person details
        const itemsForSearching = await db.user.findAll({
            include: [{
                model: db.person,
                as: 'personProfile',
                attributes: ['firstName', 'lastName', 'mail', 'phoneNumber', 'dateOfBirth']
            }]
        });

        // Setup the options for Fuse
        const options = {
            includeScore: true,
            keys: ['personProfile.firstName', 'personProfile.lastName', 'personProfile.mail', 'personProfile.phoneNumber']
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
// user profile
const getUserProfile = async (req, res, next) => {
    try {
        const userID = req.params.id;
        if (!userID) {
            return {
                message: "Error! There is missing data",
                code: 400
            };
        }
        const user = await db.user.findByPk(userID, {
            attributes: ['ID_ROWID', 'isConnected', 'role'],
            include: [{
                model: db.person,
                as: 'personProfile'
            }]
        });

        // Process the image if it exists
        if (user.personProfile.imagePath) {
            const photoPath = path.join("uploads/profileImage/", user.personProfile.imagePath);

            try {
                await fs.promises.access(photoPath, fs.constants.F_OK);
                user.personProfile.imagePath = await fs.promises.readFile(photoPath); // read the photo file contents
            } catch (error) {
                console.error(error);
                user.personProfile.imagePath = null;
            }
        }

        return res.send({
            message: "User's profile",
            userData: user,
            code: 200,
        });
    } catch (error) {
        return res.send({
            message: "An error occurred",
            error: error.message,
            code: 400,
        });

    }
}

const updateGeneralUserData = async (req, res, next) => {
    try {
        const { userID, firstName, lastName, mail, phoneNumber, dateOfBirth, role, image } = req.body.data;
        if (!userID || !firstName || !lastName || !mail || !phoneNumber || !dateOfBirth) {
            return {
                message: "Error! There is missing data",
                code: 400
            };
        }

        const user = await db.user.findByPk(userID, {
            include: [{
                model: db.person,
                as: 'personProfile'
            }]
        });
        const oldImageName = user.personProfile.imagePath;
        // delete old image if it exicte 
        if (oldImageName != null && oldImageName != "") {
            // Delete the existing image file (if it exists)
            const existingImagePath = path.join("uploads/profileImage/", oldImageName);
            if (fs.existsSync(existingImagePath)) {
                fs.unlinkSync(existingImagePath);
            }
        }
        let imagePath = '';
        if (image) {
            // Decode the Base64-encoded image data
            const base64Image = image.split(';base64,').pop();
            imagePath = `${firstName}_${Date.now()}.jpg`;

            await fs.writeFile("uploads/profileImage/" + imagePath, base64Image, { encoding: 'base64' }, (err) => {
                if (err) {
                    console.error(err);

                } else {
                    console.log('Image uploaded successfully');
                    // Now, you can do whatever you want with the image.
                }
            });

        }
        if (user && user.personProfile) {
            try {
                user.role = role;
                user.personProfile.imagePath = imagePath;
                user.personProfile.firstName = firstName;
                user.personProfile.lastName = lastName;
                user.personProfile.mail = mail;
                user.personProfile.dateOfBirth = dateOfBirth;
                user.personProfile.phoneNumber = phoneNumber;
                await user.personProfile.save();
                await user.save();
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
        }
        return res.send({
            message: `user '${user.personProfile.firstName} ${user.personProfile.lastName}' has been updated successfully.`,
            userData: user,
            code: 200,
        });
    } catch (error) {
        return res.send({
            message: "An error occurred",
            error: error.message,
            code: 400,
        });

    }
}
const updatePassword = async (req, res, next) => {
    try {
        const { userID, oldPSW, newPSW } = req.body.data;

        if (!userID || !oldPSW || !newPSW) {
            return res.status(400).send({
                message: "Error! There is missing data",
                code: 400
            });
        }

        const user = await db.user.findByPk(userID);

        if (!user) {
            return res.send({
                message: "User not found",
                code: 404
            });
        }

        // find if the password is correct 
        const passwordMatch = await bcrypt.compare(oldPSW, user.Password);

        if (!passwordMatch) {
            return res.send({
                message: 'Incorrect password.',
                code: 401
            });
        }

        // hash the new password
        const hashedPassword = await bcrypt.hash(newPSW, 10);
        user.Password = hashedPassword; // Make sure to use the correct property name
        await user.save();

        return res.send({
            message: `User  has been updated successfully.`,
            userData: user,
            code: 200,
        });

    } catch (error) {
        return res.send({
            message: "An error occurred",
            error: error.message,
            code: 500,
        });
    }
};
// get user position
const getUserPosition = async (req, res, next) => {
    const { userID } = req.body;
    if (!userID) {
        return res.status(400).send({
            message: "Error! There is missing data",
            code: 400
        });
    }
    const user = await db.user.findByPk(userID, {
        attributes: ['role']
    });
    return res.send({
        message: `user position has been updated successfully.`,
        userData: user,
        code: 200,
    });
};


module.exports = {
    addUser,
    getAllUsers,
    removeUser,
    ExploreSearchUsers,
    getUserProfile,
    updateGeneralUserData,
    updatePassword,
    getUserPosition
};