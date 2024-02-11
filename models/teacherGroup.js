module.exports = function (sequelize, DataTypes) {
    const teacherGroup = sequelize.define('teacherGroup', {
        ID_ROWID: {
            autoIncrement: true,
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true
        },
    });

    teacherGroup.associate = models => {
        teacherGroup.belongsTo(models.teacher, {
            foreignKey: 'TeacherID',
            as: 'teacher', // alias for the relation
            onDelete: 'CASCADE'
        });

        teacherGroup.belongsTo(models.groupe, {
            foreignKey: 'GroupeID',
            as: 'group', // alias for the relation
            onDelete: 'CASCADE'
        });
    };

    return teacherGroup;
};
