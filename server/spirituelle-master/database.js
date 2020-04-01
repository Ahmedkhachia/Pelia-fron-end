const Sequelize = require('sequelize');

const connection = new Sequelize('pelia2', 'root', '',{
    host: 'localhost',
    dialect:'mysql'
});
module.exports = connection; 