require('dotenv').config();

var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();

var User = require('./models/user');

app.use(bodyParser.json()); // for parsing application/json

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/api/v1/spotify/me', function(req, res) {
  var accessToken = req.query.access_token;

  var options= {
    url: 'https://api.spotify.com/v1/me',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  }
  request(options, function(err, resp, body) {
    var data = JSON.parse(body);
    User.findOrCreate({
      where: {
        username: data.id,
        spotify_page: data.external_urls.spotify,
        image_url: data.images[0].url,
      }
    })
    .spread(function(user, created) {
      
    });
  });

});

app.listen(8000, function() {
  console.log('Listening on port 8000');
});