const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    const categorie = sequelize.define('categorie', {
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isPublished: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false // Assuming default value as 'false' if not provided
        },
        publishedAt: {
            type: DataTypes.DATEONLY,
            allowNull: true // Assuming this is optional
        },
        isSubCategory: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false // Assuming default value as 'false' if not provided
        },

    },);
    categorie.associate = models => {

        // a categorie can have many programes
        categorie.hasMany(models.program, {
            foreignKey: {
                name: 'categID',
                allowNull: true
            }
        });
        // a categorie can have many subCategories
        categorie.hasMany(models.categorie, {
            foreignKey: {
                name: 'supperCatID',
                allowNull: true
            }
        });
    }

    return categorie;
};