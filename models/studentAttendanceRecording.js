const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  const studentAttendanceRecording = sequelize.define(
    "studentAttendanceRecording",
    {
      // Assuming an auto-incremented primary key for the registrations table like wisso did
      ID_ROWID: {
        autoIncrement: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      isPaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // Assuming default value as 'false' if not provided
      },
    }
  );
  return studentAttendanceRecording;
};
