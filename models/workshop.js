const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const workshop = sequelize.define('workshop', {
        // Assuming an auto-incremented primary key for the workshops table like wisso did
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: true // Assuming this is optional
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: true // Assuming this is optional
        },
        isLimited: {
            type: DataTypes.BOOLEAN,
            allowNull: true // Assuming this is optional
        },
        nbrStudent: {
            type: DataTypes.BIGINT,
            allowNull: true // Assuming this is optional
        },
        Materials: {
            type: DataTypes.STRING,
            allowNull: true
        },
    });
    workshop.associate = models => {
        workshop.belongsTo(models.program,
            {
                foreignKey: 'progId',
                onDelete: 'CASCADE'
            });
    }
    return workshop;
};
