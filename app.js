var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();

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
    body = JSON.parse(body);
    console.log(body);
    res.send(body);
  });

});

app.listen(8000, function() {
  console.log('Listening on port 8000');
});