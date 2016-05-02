require('dotenv').config();

var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var request = require('request');
var rp = require('request-promise');
var bodyParser = require('body-parser');

var User = require('./models/user');
var Event = require('./models/event');
var Playlist = require('./models/playlist');

Playlist.belongsTo(User, {foreignKey: 'user_id'})
Playlist.belongsTo(Event, {foreignKey: 'event_id'});

var app = express();
app.use(bodyParser.json()); // for parsing application/json

app.use(cookieParser());
app.use(session({
  secret: 'randomstringgoeshere',  //need to learn what this does
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 60*60*1000
  }
}));

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", process.env.ACCESS_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'DELETE');
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.post('/api/v1/spotify/me', function(req, res) {
  req.session.accessToken = req.query.access_token;

  var options= {
    url: 'https://api.spotify.com/v1/me',
    headers: {
      'Authorization': 'Bearer ' + req.session.accessToken
    }
  };

  request(options, function(err, resp, body) {
    var data = JSON.parse(body);

    if (data.error) {
      console.log(data);
      res.send({
        success: false,
        error: data
      });
      return;
    }

    User.findOrCreate({
      where: {
        username: data.id
      },
      defaults: {
        spotify_page: data.external_urls.spotify,
        image_url: data.images[0].url
      }
    })
    .spread(function(user, created) {
      if(!user) {
        return res.json({
          success: false,
          error: 'User not found or created'
        });
      }
      req.session.user = user;
      res.send({
        success: true,
        user: user
      });
    });
  });

});

app.get('/api/v1/admin', function(req, res) {
  if (req.query.u=='admin' && req.query.p=='laravel') {
    req.session.admin = true;
    res.send({
      success: req.session.admin
    })
  } else {
    req.session.admin = false;
    res.send({
      success: req.session.admin
    });
  }
});

app.get('/api/v1/playlists', function(req, res) {
  Playlist.findAll(({ 
    include: [User, Event], 
    order: 'createdAt DESC' 
  })).then(function(playlists) {
    if (!playlists) {
      return res.json({
        success: false,
        error: 'Error retrieving all playlists'
      });
    }

    res.send({
      success: true,
      playlists: playlists
    });
  });
});

app.delete('/api/v1/playlists/:id', function(req, res) {
  if (req.session.admin) {
    Playlist.findById(req.params.id).then(function(playlist) {
      if (!playlist) {
        return res.json({
          success: false,
          error: 'Playlist not found.'
        });
      }

      Event.findById(playlist.event_id).then(function(event) {
        event.playlist_count--;
        event.save();
      });

      User.findById(playlist.user_id).then(function(user) {
        user.playlist_count--;
        user.save();
      });

      playlist.destroy().then(function(){
        res.send({
          success: true
        });
      });

    });
  } else {
    return res.json({
      success: false,
      error: 'Not authorized.'
    });
  }
});

app.get('/api/v1/users', function(req, res) {
  if (req.session.admin) {
    User.findAll({ order: 'createdAt DESC' }).then(function(users) {
      if (!users) {
        return res.json({
          success: false,
          error: 'Error retrieving all users'
        });
      }

      res.send({
        success: true,
        users: users
      });
    });
  } else {
    return res.json({
      success: false,
      error: 'Not authorized.'
    });
  }
});

app.delete('/api/v1/users/:id', function(req, res) {
  if (req.session.admin) {
    User.findById(req.params.id).then(function(user) {
      if (!user) {
        return res.json({
          success: false,
          error: 'User not found.'
        });
      }

      Playlist.findAll({
        where: {
          user_id: user.id
        }
      }).then(function(playlists) {
        if (playlists) {
          playlists.forEach(function (playlist) {
            Event.findById(playlist.event_id).then(function(event) {
              event.playlist_count--;
              event.save();
            });
            playlist.destroy();
          });
        }
      });

      user.destroy().then(function(){
        res.send({
          success: true
        });
      });

    });
  } else {
    return res.json({
      success: false,
      error: 'Not authorized.'
    });
  }
});

app.get('/api/v1/events', function(req, res) {
  if (req.session.admin) {
    Event.findAll({ order: 'createdAt DESC' }).then(function(events) {
      if (!events) {
        return res.json({
          success: false,
          error: 'Error retrieving all events'
        });
      }

      res.send({
        success: true,
        events: events
      });
    });
  } else {
    res.send({
      success: false,
      error: 'Not authorized.'
    });
  }
});

app.delete('/api/v1/events/:id', function(req, res) {
  if (req.session.admin) {
    Event.findById(req.params.id).then(function(event) {
      if (!event) {
        return res.json({
          success: false,
          error: 'Event not found.'
        });
      }

      Playlist.findAll({
        where: {
          event_id: event.id
        }
      }).then(function(playlists) {
        if (playlists) {
          playlists.forEach(function (playlist) {
            User.findById(playlist.user_id).then(function(user) {
              user.playlist_count--;
              user.save();
            });
            playlist.destroy();
          });
        }
      });

      event.destroy().then(function(){
        res.send({
          success: true
        });
      });

    });
  } else {
    return res.json({
      success: false,
      error: 'Not authorized.'
    });
  }
});

app.get('/api/v1/seatgeek/events', function(req, res) {
  var query = req.query.q;

  request('https://api.seatgeek.com/2/events?q='+query, function(err, resp, body) {
    var data = JSON.parse(body);
    var events = [];
    if (data.error) {
      console.log(data);
      res.send({
        success: false,
        error: data
      });
      return;
    }

    data.events.forEach(function(event) {
      if (event.title.toLowerCase().includes(query.toLowerCase())) {
        events.push({
          id: event.id,
          title: event.title,
          date: event.datetime_utc,
          location: event.venue.display_location,
          artists: event.performers,
          selected: false
        });
      }
    });

    res.send({
      success: true,
      events: events
    });
  });
});

app.get('/api/v1/spotify/search', function(req, res) {
  var artists = req.query.artists;
  var error_msg = [];
  req.session.artists = [];
  var promises = [];

  artists.forEach(function(artist) {
    if (artist.checked === 'true') {
      promises.push(rp('https://api.spotify.com/v1/search?q='+artist.name+'&type=artist', function(err, resp, body){
        var data = JSON.parse(body);
        
        if (data.error) {
          console.log(data);
          res.send({
            success: false,
            error: data
          });
          return;
        }

        if (data.artists && data.artists.items.length == 0) {
          error_msg.push("Could not find artist, " + artist.name + ", on Spotify.");
        } else {
          req.session.artists.push({
            id: data.artists.items[0].id,
            name: data.artists.items[0].name
          });
        }
      }));
    }
  });

  Promise.all(promises).then(function() {
    res.send({
      success: true,
      error: error_msg
    });
  });
});

app.get('/api/v1/spotify/artists/top-tracks', function(req, res) {
  var num_tracks = req.query.tracks;
  var promises = [];
  var error_msg = [];
  req.session.trackIds = [];

  if (req.session.artists === undefined || req.session.artists.length == 0) {
    res.send({
      success: false,
      error: "No artists selected"
    });
    return;
  }

  req.session.artists.forEach(function(artist) {
    promises.push(rp('https://api.spotify.com/v1/artists/'+artist.id+'/top-tracks?country=US', function(err, resp, body) {
      var data = JSON.parse(body);

      if (data.error) {
        console.log(data);
        res.send({
          success: false,
          error: data
        });
        return;
      }

      if (data.tracks) {
        var length = num_tracks;
        if (data.tracks.length < length) {
          error_msg.push(artist.name + ' only has ' + data.tracks.length + ' tracks on Spotify.');
          length = data.tracks.length;
        }

        for (var i = 0; i < length; i++) {
          req.session.trackIds.push('spotify:track:'+data.tracks[i].id);
        }
      }
    }));
  });

  req.session.artists = [];

  Promise.all(promises).then(function() {
    res.send({
      success: true,
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
    url: 'https://api.spotify.com/v1/users/'+req.session.user.username+'/playlists',
    headers: {
      'Authorization': 'Bearer ' + req.session.accessToken
    },
    contentType: 'application/json',
    body: JSON.stringify({name: playlistTitle})
  };

  request(options, function(err, resp, body) {
    var data = JSON.parse(body);

    if (data.error) {
      console.log(data);
      res.send({
        success: false,
        error: data
      });
      return;
    }

    Event.findOrCreate({
        where: {
          title: eventTitle,
          date: decodeURIComponent(req.query.date),
          location: decodeURIComponent(req.query.location)
        }
      })
      .spread(function(event, created) {
        if (!event) {
          return res.json({
            success: false,
            error: 'Event not found or created'
          });
        }
        Playlist.create({
            user_id: req.session.user.id,
            title: playlistTitle,
            event_id: event.id,
            playlist_id: data.id,
            playlist_url: data.href
          })
          .then(function(playlist) {
            if(!playlist) {
              return res.json({
                error: 'Playlist not created'
              });
            }

            event.playlist_count++;
            event.save();
            User.findById(req.session.user.id).then(function(user){
              if (!user) {
                return res.json({
                  success: false,
                  error: 'User not found. Did not update playcount'
                });
              }
              user.playlist_count++;
              user.save();
            });
            req.session.playlist_id = playlist.playlist_id;

            res.send({
              success: true
            });
          });
      });
  });
});

app.post('/api/v1/spotify/users/playlists/tracks', function(req, res) {
  // spotify request only adds 100 tracks
  var trackGroup = [], size = 100;
  var tracks_size = req.session.trackIds.length;
  while(req.session.trackIds.length > 0) {
    trackGroup.push(req.session.trackIds.splice(0, size));
  }
  var promises = [];

  trackGroup.forEach(function(tracks) {
    var options= {
      method: 'POST',
      url: 'https://api.spotify.com/v1/users/'+req.session.user.username+'/playlists/'+req.session.playlist_id+'/tracks',
      headers: {
        'Authorization': 'Bearer ' + req.session.accessToken
      },
      contentType: 'application/json',
      body: JSON.stringify({uris: tracks})
    };

    promises.push(rp(options, function(err, resp, body){
      var data = JSON.parse(body);
      if (data.error) {
        console.log(data);
        res.send({
          success: false,
          error: data
        });
        return;
      }
    }));
  });

  Promise.all(promises).then(function() {
    res.send({
      success: true,
      tracks_size: tracks_size
    });
  });

});

app.listen(process.env.PORT || 8000, function() {
  console.log('Listening on port 8000');
});
