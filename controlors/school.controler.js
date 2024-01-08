const fs = require('fs');

const updateGeneralSchoolData = async (req, res, next) => {
    try {
        const updatePayload = req.body.data;
        /**
         updatePayload = {
         name: 'New Name',
         address: "address",
         lib:".....",
         contacts: {
            phone: '555-5555',
            mail: 'newemail@example.com',
            facebook: "......",
            twitter: ".......",
            instagram: "......."
        },
        logo: 'data',
        };
         */
        const filePath = './data/school.json';
        const schoolData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        schoolData.name = updatePayload.name;
        schoolData.address = updatePayload.address;
        schoolData.contacts = {
            ...schoolData.contacts,
            ...updatePayload.contacts
        };
        //logo part not yet finished
        schoolData.logo = updatePayload.logo;
        schoolData.lib = updatePayload.lib;

        fs.writeFileSync(filePath, JSON.stringify(schoolData, null, 2));

        console.log('School data updated successfully.');
        res.send({
            message: "School data updated successfully",
            dataa: schoolData,
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


const getGeneralSchoolData = async (req, res, next) => {
    try {
        const filePath = './data/school.json';
        const schoolData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.send({
            message: "Recuperate General School data successfully",
            data: schoolData,
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
module.exports = {
    updateGeneralSchoolData,
    getGeneralSchoolData
}