const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const studentLevel = sequelize.define('studentLevel', {
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
    });

    studentLevel.associate = models => {
        studentLevel.belongsTo(models.student, {
            foreignKey: 'studentID',
        });
        studentLevel.belongsTo(models.educationalLevel, {
            foreignKey: 'levelID',
        });
        studentLevel.belongsTo(models.studyYear, {
            foreignKey: 'yearID',
            allowNull: true
        });
    }

    return studentLevel;
};
