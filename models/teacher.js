const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  const teacher = sequelize.define("teacher", {
    ID_ROWID: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },

    TeacherID: {
      type: DataTypes.BIGINT,
      unique: true,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    personId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "people", // This refers to the table name 'persons'
        key: "ID_ROWID",
      },
    },
    Password: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    isConnected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Assuming default value as 'false' if not provided
    },
    LastcnxDate: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Assuming this is optional
    },
    cnxToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
  teacher.associate = (models) => {
    teacher.belongsTo(models.person, {
      as: "personProfile2", // An alias for this relation
      foreignKey: "personId",
      onDelete: "CASCADE", // If a user is deleted, the related person profile remains
    });
    // A teacher can be responsibale of many Groups
    teacher.belongsToMany(models.groupe, {
      through: models.teacherGroup,
      foreignKey: "TeacherID", // Using the correct primary key name for teacher
      onDelete: "CASCADE", // This is the key part for cascading delete
    });
    teacher.belongsToMany(models.session, {
      through: models.teacherAttendanceRecording,
      foreignKey: "teacherID", // Using the correct primary key name for teacher
    });
    teacher.belongsToMany(models.privateSession, {
      through: models.teachersInPrivateSession,
      foreignKey: "teacherID", // Using the correct primary key name for teacher
    });
    teacher.hasMany(models.salaire, {
      foreignKey: "teacherID",
      allowNull: false,
    });
  };
  return teacher;
};
