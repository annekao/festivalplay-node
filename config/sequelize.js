var Sequelize = require('sequelize');

var host = process.env.DB_HOST;
var db = process.env.DB_NAME;
var user = process.env.DB_USER;
var pw = process.env.DB_PW;

var sequelize = new Sequelize(db, user, pw, {
  host: host,
  dialect: 'mysql'
});

module.exports = sequelize;