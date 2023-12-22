const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const classe = sequelize.define('class', {
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        className: {
            type: DataTypes.STRING,
            allowNull: true
        },
        capacité: {
            type: DataTypes.BIGINT,
            allowNull: true
        }

    },);
    classe.associate = models => {
        classe.hasMany(models.session, {
            foreignKey: 'classID',
            allowNull: true
        });
    }
    return classe;
};