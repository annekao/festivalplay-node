var sequelize = require('./../config/sequelize');
var Sequelize = require('sequelize');

module.exports = sequelize.define('event', {
  title: {
    type: Sequelize.STRING,
    field: 'title'
  },
  location: {
    type: Sequelize.STRING,
    field: 'location'
  },
  date: {
    type: Sequelize.STRING,
    field: 'date'
  },
  playlist_count: {
    type: Sequelize.INTEGER,
    field: 'playlist_count',
    defaultValue: 0
  }
});
