import Ember from 'ember';

function spotifyLogin(callback)
{
  var CLIENT_ID = '4352ff0df1ed44599107b6b1eea51bbc';
  var REDIRECT_URI = 'http://localhost:4200';

  function getLoginURL(scopes) {
    return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
      '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
      '&scope=' + encodeURIComponent(scopes.join(' ')) +
      '&response_type=token';
  }

  var url = getLoginURL([
    'user-read-email',
    'playlist-modify-public'
  ]);

  var width = 450,
    height = 730,
    left = (screen.width / 2) - (width / 2),
    top = (screen.height / 2) - (height / 2);

  window.addEventListener("message", function (event) {
    var hash = JSON.parse(event.data);
    if (hash.type == 'access_token') {
      callback(hash.access_token);
    }
  }, false);

  var w = window.open(url,
    'Spotify',
    'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
  );
}

export default Ember.Route.extend({
  actions: {
    login() {
      spotifyLogin(function (accessToken) {
        console.log(accessToken);
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('home-container').innerHTML = "potato";
      });
    }
  }

});
