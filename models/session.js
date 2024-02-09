const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  const session = sequelize.define("session", {
    ID_ROWID: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    startAt: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    endAt: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    dayCode: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Assuming this is optional
    },
    isAchieved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Assuming default value as 'false' if not provided
    },
  });
  session.associate = (models) => {
    session.belongsTo(models.class, {
      foreignKey: "classID",
      allowNull: true,
    });

    session.belongsTo(models.groupe, {
      foreignKey: "groupID",
      allowNull: true,
    });
    session.belongsToMany(models.student, {
      through: models.studentAttendanceRecording,
      foreignKey: "sessionID", // Using the correct primary key name for teacher
    });
    session.belongsToMany(models.teacher, {
      through: models.teacherAttendanceRecording,
      foreignKey: "sessionID", // Using the correct primary key name for teacher
    });
  };
  return session;
};
