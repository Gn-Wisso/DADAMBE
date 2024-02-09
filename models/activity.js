const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const activity = sequelize.define('activity', {
        // Assuming an auto-incremented primary key for the activitys table like wisso did
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        timing: {
            type: DataTypes.TIME,
            allowNull: true // Assuming this is optional
        },
        emplacement: {
            type: DataTypes.STRING,
            allowNull: true
        },
    });
    activity.associate = models => {
        activity.belongsTo(models.program,
            {
                foreignKey: 'progId',
                onDelete: 'CASCADE' // If a person is deleted, the related user is also deleted
            });
    }
    return activity;
};
