var sequelize = require('./../config/sequelize');
var Sequelize = require('sequelize');

module.exports = sequelize.define('playlist', {
  user_id: {
    type: Sequelize.INTEGER,
    field: 'user_id'
  },
  title: {
    type: Sequelize.STRING,
    field: 'title'
  },
  event_id: {
    type: Sequelize.STRING,
    field: 'event_id'
  },
  playlist_id: {
    type: Sequelize.STRING,
    field: 'playlist_id'
  },
  playlist_url: {
    type: Sequelize.STRING,
    field: 'playlist_url'
  }
});