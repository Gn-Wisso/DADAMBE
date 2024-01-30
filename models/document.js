const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const document = sequelize.define('document', {
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        documentName: {
            type: DataTypes.STRING,
            allowNull: true
        },

    },);
    document.associate = models => {
        document.belongsTo(models.student, {
            foreignKey: {
                name: 'studentID',
                allowNull: false,
                onDelete: 'CASCADE', // This is the key part for cascading delete
            }
        });
    }
    return document;
};