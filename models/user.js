var sequelize = require('./../config/sequelize');
var Sequelize = require('sequelize');

module.exports = sequelize.define('user', {
  name: {
    type: Sequelize.STRING,
    field: 'username'
  },
  spotify_page: {
    type: Sequelize.STRING,
    field: 'spotify_page'
  },
  image: {
    type: Sequelize.STRING,
    field: 'image_url'
  },
  playlists: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    field: 'playlist_urls'
  }
}, {
  timestamps: false
});