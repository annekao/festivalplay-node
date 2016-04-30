var sequelize = require('./../config/sequelize');
var Sequelize = require('sequelize');

module.exports = sequelize.define('user', {
  username: {
    type: Sequelize.STRING,
    field: 'username'
  },
  spotify_page: {
    type: Sequelize.STRING,
    field: 'spotify_page'
  },
  image_url: {
    type: Sequelize.STRING,
    field: 'image_url'
  }
}, {
  timestamps: false
});