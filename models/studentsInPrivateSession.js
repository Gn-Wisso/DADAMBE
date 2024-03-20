const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  const studentsInPrivateSession = sequelize.define(
    "studentsInPrivateSession",
    {
      // Assuming an auto-incremented primary key for the registrations table like wisso did
      ID_ROWID: {
        autoIncrement: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      isAttended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // Assuming default value as 'false' if not provided
      },
      isPaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // Assuming default value as 'false' if not provided
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
    }
  );
  studentsInPrivateSession.associate = (models) => {};
  return studentsInPrivateSession;
};
