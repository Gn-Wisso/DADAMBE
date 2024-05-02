const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  const teachersInPrivateSession = sequelize.define(
    "teachersInPrivateSession",
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
      amountByStudent: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      NumberOfAttendees: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
    }
  );
  teachersInPrivateSession.associate = (models) => {
    teachersInPrivateSession.belongsTo(models.salaire, {
      foreignKey: "salaireID",
      allowNull: false,
    });
  };
  return teachersInPrivateSession;
};
