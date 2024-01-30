const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const educationalLevel = sequelize.define('educationalLevel', {
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        lib: {
            type: DataTypes.STRING,
            allowNull: true
        },
    });

    educationalLevel.associate = models => {
        educationalLevel.hasMany(models.student, {
            foreignKey: 'LevelID',
            allowNull: false
        });
        educationalLevel.hasMany(models.studyYear, {
            foreignKey: 'LevelID',
            onDelete: 'CASCADE', // This is the key part for cascading delete
            allowNull: false
        });
        educationalLevel.hasOne(models.studentLevel, {
            foreignKey: 'levelID',
        });
    }

    return educationalLevel;
};
