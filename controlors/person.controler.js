const db = require(".././models");
const seq = require("sequelize");
const op = seq.Op;
require("dotenv").config();
const fs = require('fs');

// because we will use it many time i made it as a separated function
async function addPerson(data) {
    try {
        const { firstName, lastName, mail, phoneNumber, dateOfBirth, image } = data;
        if (!firstName || !lastName || !mail || !phoneNumber || !dateOfBirth) {
            return {
                message: "Error! There is missing data",
                code: 400
            };
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
        const person = await db.person.create({
            firstName,
            lastName,
            mail,
            imagePath: imagePath,
            phoneNumber,
            dateOfBirth,
        });
        return person.ID_ROWID;
    }
    catch (error) {
        console.error(error);
        // Check if error is a validation error
        if (error.name === 'SequelizeValidationError') { 
            return {
                message:"corrigez votre email", 
                code: 401
            };
        }else{
        return {
            message: "An error ",
            error: error.message,
            code: 400 // This might be more appropriate for unknown server errors.
        };}
    }
      
}


module.exports = {
    addPerson,
};