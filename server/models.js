const Sequelize = require('sequelize');
const connection = require('./database');

const users = connection.define('users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    prenom: {
        type: Sequelize.STRING,
        allowNull: false
    },
    nom: {
        type: Sequelize.STRING,
        allowNull: false
    },
    ville: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    phone: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING
    }
    
});

module.exports = users;