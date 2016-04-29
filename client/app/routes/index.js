import Ember from 'ember';
import ENV from "client/config/environment";

function getHashParams() {
  var hashParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1);
  while ( e = r.exec(q)) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

export default Ember.Route.extend({
  model() {
    console.log(ENV);
    var params = getHashParams();
    if (params.access_token !== undefined) {
      return $.getJSON('http://localhost:8000/api/v1/spotify/me?access_token='+params.access_token).then(function(response){

      });
    }
  },
  actions: {
    login() {
      var CLIENT_ID = ENV.SPOTIFY_CLIENT_ID;
      var REDIRECT_URI = ENV.SPOTIFY_REDIRECT_URI;

      function getLoginURL(scopes) {
        return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
          '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
          '&scope=' + encodeURIComponent(scopes.join(' ')) +
          '&response_type=token&show_dialog=true';
      }

      var url = getLoginURL([
        'user-read-email',
        'playlist-modify-public'
      ]);

      window.location.replace(url);
    }
  }

});
