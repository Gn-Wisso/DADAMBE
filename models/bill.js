const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  const bill = sequelize.define("bill", {
    ID_ROWID: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "bill amount",
    },
  });

  // Define the associations
  bill.associate = (models) => {
    bill.belongsTo(models.student, {
      foreignKey: "studentID",
      allowNull: false,
    });

    bill.hasMany(models.paymentSessionMode, {
      foreignKey: "billD",
      allowNull: false,
    });
    bill.hasMany(models.paymentTotalMode, {
      foreignKey: "billD",
      allowNull: false,
    });
    bill.hasMany(models.studentsInPrivateSession, {
      foreignKey: "billD",
      allowNull: false,
    });
  };

  return bill;
};
