const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  const teacherAttendanceRecording = sequelize.define(
    "teacherAttendanceRecording",
    {
      // Assuming an auto-incremented primary key for the registrations table like wisso did
      ID_ROWID: {
        autoIncrement: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      NumberOfAttendees: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      isPaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // Assuming default value as 'false' if not provided
      },
      isValidate: {
        // validate by user or secretaire
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
    }
  );
  teacherAttendanceRecording.associate = (models) => {
    teacherAttendanceRecording.belongsTo(models.salaire, {
      foreignKey: "salaireID",
      allowNull: false,
    });
  };
  return teacherAttendanceRecording;
};
