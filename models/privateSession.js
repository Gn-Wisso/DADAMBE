const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  const privateSession = sequelize.define("privateSession", {
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
    lib: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  privateSession.associate = (models) => {
    privateSession.belongsTo(models.class, {
      foreignKey: "classID",
      allowNull: true,
    });

    privateSession.belongsToMany(models.student, {
      through: models.studentsInPrivateSession,
      foreignKey: "privateSessionID", // Using the correct primary key name for teacher
    });
    privateSession.belongsToMany(models.teacher, {
      through: models.teachersInPrivateSession,
      foreignKey: "privateSessionID", // Using the correct primary key name for teacher
    });
  };
  return privateSession;
};
