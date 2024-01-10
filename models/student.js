const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const student = sequelize.define('student', {
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        studentCode: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        isActive: {
            type: DataTypes.ENUM('Active', 'Inactive'),
            allowNull: false,
            defaultValue: 'Inactive'
        },
        personId: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'people',  // This refers to the table name 'persons'
                key: 'ID_ROWID'
            }
        }

    },);
    student.associate = models => {
        student.belongsTo(models.person, {
            as: 'personProfile2', // An alias for this relation
            foreignKey: 'personId',
            onDelete: 'CASCADE' // If a user is deleted, the related person profile remains (you can adjust this behavior as needed)
        });
        // many student regist in our programes
        student.belongsToMany(models.program, {
            through: models.registration,
            foreignKey: 'StudentID', // Using the correct primary key name for student
            otherKey: 'progID',    // Using the correct primary key name for program
            as: 'programs',
            onDelete: 'CASCADE'// This is the key part for cascading delete

        });
        // A student can be in many Groups 
        student.belongsToMany(models.groupe, {
            through: models.studentGroup,
            foreignKey: 'StudentID', // Using the correct primary key name for student
            onDelete: 'CASCADE', // This is the key part for cascading delete

        });
        student.hasMany(models.payment, {
            foreignKey: 'StudentID',
            as: 'payments',
            onDelete: 'CASCADE', // This is the key part for cascading delete
            allowNull: false
        });

    }
    return student;
};