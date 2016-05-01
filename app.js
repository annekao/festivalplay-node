require('dotenv').config({silent: true});

var express = require('express');
var request = require('request');
var rp = require('request-promise');
var bodyParser = require('body-parser');
var app = express();

var accessToken = undefined;
var userId = '';
var username = '';
var artists = [];
var trackIds = [];

var User = require('./models/user');
var Event = require('./models/event');
var Playlist = require('./models/playlist');

app.use(bodyParser.json()); // for parsing application/json

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.post('/api/v1/spotify/me', function(req, res) {
  accessToken = req.query.access_token;

  var options= {
    url: 'https://api.spotify.com/v1/me',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  };

  request(options, function(err, resp, body) {
    var data = JSON.parse(body);

    if (data.error) {
      console.log(data);
      res.send(data);
      return;
    }

    username = data.id;
    User.findOrCreate({
      where: {
        username: username
      },
      defaults: {
        spotify_page: data.external_urls.spotify,
        image_url: data.images[0].url
      }
    })
    .spread(function(user, created) {
      userId = user.id;
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
          date: event.datetime_utc,
          readableDate: days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear(),
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

    if (data.artists && data.artists.items.length == 0) {
      error_msg = "Could not find artist, " + query + ", on Spotify.";
    } else {
      artists.push({
        id: data.artists.items[0].id,
        name: data.artists.items[0].name
      });
    }

    res.send({
      error: error_msg
    });
  });
});

app.get('/api/v1/spotify/artists/top-tracks', function(req, res) {
  var num_tracks = req.query.tracks;
  var promises = [];
  var error_msg = [];

  artists.forEach(function(artist) {
    promises.push(rp('https://api.spotify.com/v1/artists/'+artist.id+'/top-tracks?country=US', function(err, resp, body) {
      var data = JSON.parse(body);

      if (data.tracks) {
        var length = num_tracks;
        if (data.tracks.length < length) {
          error_msg.push(artist.name + ' only has ' + data.tracks.length + ' tracks on Spotify.');
          length = data.tracks.length;
        }

        for (var i = 0; i < length; i++) {
          trackIds.push('spotify:track:'+data.tracks[i].id);
        }
      }
    }));
  });

  Promise.all(promises).then(function() {
    res.send({
      error: error_msg
    });
  });
});

app.post('/api/v1/spotify/users/playlists', function(req, res) {
  var playlistTitle = decodeURIComponent(req.query.title);
  var eventTitle = decodeURIComponent(req.query.event);
  console.log(req.query);

  var options= {
    method: 'POST',
    url: 'https://api.spotify.com/v1/users/'+username+'/playlists',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    },
    contentType: 'application/json',
    body: JSON.stringify({name: playlistTitle})
  };

  request(options, function(err, resp, body) {
    var data = JSON.parse(body);

    if (data.error) {
      console.log(data);
      res.send(data);
      return;
    }

    Event.findOrCreate({
        where: {
          title: eventTitle
        },
        defaults: {
          date: decodeURIComponent(req.query.date),
          location: decodeURIComponent(req.query.location)
        }
      })
      .spread(function(event, created) {
        Playlist.create({
            user_id: userId,
            title: playlistTitle,
            event_id: event.id,
            playlist_id: data.id,
            playlist_url: data.href
          })
          .then(function(playlist) {
            res.send(playlist);
          });
      });
  });
});

app.post('/api/v1/spotify/users/playlists/tracks', function(req, res) {
  // spotify request only adds 100 tracks
  var trackGroup = [], size = 100;
  var tracks_size = trackIds.length;
  while(trackIds.length > 0) {
    trackGroup.push(trackIds.splice(0, size));
  }
  var promises = [];

  trackGroup.forEach(function(tracks) {
    var options= {
      method: 'POST',
      url: 'https://api.spotify.com/v1/users/'+username+'/playlists/'+req.query.playlist_id+'/tracks',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      contentType: 'application/json',
      body: JSON.stringify({uris: tracks})
    };

    promises.push(rp(options));
  });

  Promise.all(promises).then(function() {
    res.send({
      tracks_size: tracks_size
    });
  });

});

app.listen(8000, function() {
  console.log('Listening on port 8000');
});