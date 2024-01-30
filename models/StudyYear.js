const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const studyYear = sequelize.define('studyYear', {
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
    },);
    studyYear.associate = models => {
        studyYear.belongsTo(models.educationalLevel, {
            foreignKey: 'LevelID',
            allowNull: false
        });
        studyYear.hasOne(models.studentLevel, {
            foreignKey: 'yearID',
        });
    }
    return studyYear;
};