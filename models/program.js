const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const program = sequelize.define('program', {
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
            
        },
        discription: {
            type: DataTypes.TEXT,
            allowNull: true
            
        },
        isPublished: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false // Assuming default value as 'false' if not provided
        },
        PublishedDate: {
            type: DataTypes.DATEONLY,
            allowNull: true // Assuming this is optional
        },
        EndInsciptionDate: {
            type: DataTypes.DATEONLY,
            allowNull: true // Assuming this is optional
        }

    },);
    program.associate = models => {
        
        program.belongsToMany(models.student, {
            through: models.registration,
            foreignKey: 'ID_ROWID', // Using the correct primary key name for program
            otherKey: 'StudentID',  // Assuming the primary key name for student is StudentID
            as: 'students'
        });
        // //create an ID_ROWID ref to the the last modification (updatedBy)
        // address.belongsTo(models.user, {
        //     foreignKey: {
        //         name: 'updatedBy',
        //         allowNull: true
        //     }
        // });
    }
   return program;
};