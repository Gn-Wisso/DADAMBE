const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const session = sequelize.define('session', {
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        startAt: {
            type: DataTypes.TIME,
            allowNull: true

        },
        endAt: {
            type: DataTypes.TIME,
            allowNull: true

        },
        dayCode: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: true // Assuming this is optional
        },

    },);
    session.associate = models => {
        session.belongsTo(models.class, {
            foreignKey: 'classID',
            allowNull: true
        });

        session.belongsTo(models.groupe, {
            foreignKey: 'groupID',
            allowNull: true
        });
    }
    return session;
};