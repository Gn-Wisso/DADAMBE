const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  const program = sequelize.define("program", {
    ID_ROWID: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    discription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Assuming default value as 'false' if not provided
    },
    isSkiped: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Assuming default value as 'false' if not provided
    },
    PublishedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Assuming this is optional
    },
    EndInsciptionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Assuming this is optional
    },
    prix: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Payment amount",
    },
    typeOfPaiment: {
      // total - par Séance - par Moins
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
  program.associate = (models) => {
    // program belong to one categorie
    program.belongsTo(models.categorie, {
      foreignKey: {
        name: "categID",
        allowNull: true,
      },
    });

    // many student regist in our programes
    program.belongsToMany(models.student, {
      through: models.registration,
      as: "students",
      foreignKey: "progID", // Using the correct primary key name for program
      otherKey: "StudentID", // Assuming the primary key name for student is StudentID
    });
    program.hasMany(models.groupe, {
      foreignKey: {
        name: "progID",
        allowNull: true,
      },
    });
    program.hasOne(models.formation, {
      foreignKey: "progId",
      onDelete: "CASCADE",
    });
    program.hasOne(models.cour, {
      foreignKey: "progId",
      onDelete: "CASCADE",
    });
    program.hasOne(models.activity, {
      foreignKey: "progId",
      onDelete: "CASCADE",
    });
    program.hasOne(models.workshop, {
      foreignKey: "progId",
      onDelete: "CASCADE",
    });
    program.hasMany(models.payment, {
      foreignKey: "progID",
      as: "payments",
      onDelete: "CASCADE", // This is the key part for cascading delete
      allowNull: false,
    });
    program.hasMany(models.paymentTotalMode, {
      foreignKey: "progID",
      onDelete: "CASCADE", // This is the key part for cascading delete
    });
  };
  return program;
};
