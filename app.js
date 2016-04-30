require('dotenv').config({silent: true});

var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();

var artist_ids = [];

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

    if (body.error) {
      console.log(body);
      res.send(body);
    }

    User.findOrCreate({
      where: {
        username: data.id,
        spotify_page: data.external_urls.spotify,
        image_url: data.images[0].url,
      }
    })
    .spread(function(user, created) {
      res.send(user);
    });
  });

});

app.get('/api/v1/seatgeek/events', function(req, res) {
  var query = req.query.q;

  request('https://api.seatgeek.com/2/events?q='+query, function(err, resp, body) {
    var data = JSON.parse(body);
    var events = [];

    data.events.forEach(function(event) {
      if (event.title.toLowerCase().includes(query)) {
        var date = new Date(event.datetime_utc);
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        events.push({
          id: event.id,
          title: event.title,
          date: days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear(),
          location: event.venue.display_location,
          artists: event.performers,
          selected: false
        });
      }
    });

    res.send(events);
  });

});

app.get('/api/v1/spotify/search', function(req, res) {
  var query = req.query.q;
  var error_msg = undefined;

  request('https://api.spotify.com/v1/search?q='+query+'&type=artist', function(err, resp, body) {
    var data = JSON.parse(body);

    if (data.artists.items.length == 0) {
      error_msg = query + " not found in Spotify!";
    } else {
      artist_ids.push(data.artists.items[0].id);
    }

    res.send({
      error: error_msg
    });
  });

});

app.listen(8000, function() {
  console.log('Listening on port 8000');
});