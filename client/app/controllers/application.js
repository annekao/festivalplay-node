import Ember from 'ember';
import ENV from "client/config/environment";

export default Ember.Controller.extend({
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
