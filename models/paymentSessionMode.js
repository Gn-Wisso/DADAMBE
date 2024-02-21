const Sequelize = require("sequelize");
// this for programes with a session mode type of payment
module.exports = function (sequelize, DataTypes) {
  const paymentSessionMode = sequelize.define("paymentSessionMode", {
    ID_ROWID: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "paymentSessionMode amount",
    },
  });

  // Define the associations
  paymentSessionMode.associate = (models) => {
    paymentSessionMode.belongsTo(models.studentAttendanceRecording, {
      foreignKey: "StudentAttRecID",
    });
    paymentSessionMode.belongsTo(models.student, {
      foreignKey: "studentID",
      allowNull: false,
    });
    paymentSessionMode.belongsTo(models.bill, {
      foreignKey: "billD",
      allowNull: false,
    });
  };

  return paymentSessionMode;
};
