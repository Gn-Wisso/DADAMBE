const Sequelize = require("sequelize");
// this for programes with a total mode type of payment
module.exports = function (sequelize, DataTypes) {
  const paymentTotalMode = sequelize.define("paymentTotalMode", {
    ID_ROWID: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "paymentTotalMode amount",
    },
  });

  // Define the associations
  paymentTotalMode.associate = (models) => {
    paymentTotalMode.belongsTo(models.program, {
      foreignKey: "progID",
    });
    paymentTotalMode.belongsTo(models.bill, {
      foreignKey: "billD",
    });
  };

  return paymentTotalMode;
};
