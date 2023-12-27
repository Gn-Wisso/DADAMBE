'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('programs', 'prix', {
      type: Sequelize.FLOAT,
      allowNull: false,
      comment: "Payment amount"
    });

    await queryInterface.addColumn('programs', 'typeOfPaiment', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('programs', 'prix');
    await queryInterface.removeColumn('programs', 'typeOfPaiment');
  }
};
