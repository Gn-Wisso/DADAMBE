const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    const payment = sequelize.define('payment', {
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        montant: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: "Payment amount"
        },

    });

    // Define the associations
    payment.associate = models => {
        payment.belongsTo(models.student, {
            foreignKey: 'StudentID',
            as: 'students'
        });

        payment.belongsTo(models.program, {
            foreignKey: 'progID',
            as: 'programs'
        });
    };

    return payment;
};
