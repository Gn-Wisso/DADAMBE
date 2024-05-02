const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  const salaire = sequelize.define("salaire", {
    ID_ROWID: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "salaire amount",
    },
  });

  // Define the associations
  salaire.associate = (models) => {
    salaire.belongsTo(models.teacher, {
      foreignKey: "teacherID",
      allowNull: false,
    });
    salaire.hasMany(models.teacherAttendanceRecording, {
      foreignKey: "salaireID",
      allowNull: false,
    });
    salaire.hasMany(models.teachersInPrivateSession, {
      foreignKey: "salaireID",
      allowNull: false,
    });
  };

  return salaire;
};
