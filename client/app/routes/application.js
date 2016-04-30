import Ember from 'ember';

function getHashParams() {
  var hashParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1);
  while ( e = r.exec(q)) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

function setAccessToken(token) {
  localStorage.setItem('access_token', token);
  localStorage.setItem('access_token_expires', (new Date()).getTime() + 3600*1000); // 1 hour
}

export default Ember.Route.extend({
  model() {
    var params = getHashParams();
    if (params.access_token !== undefined) {
      return $.getJSON('http://localhost:8000/api/v1/spotify/me?access_token='+params.access_token)
        .then(function(response){
          setAccessToken(params.access_token);
          return response;
      });
    } else if((new Date()).getTime() < localStorage.getItem('access_token_expires')) {
      return $.getJSON('http://localhost:8000/api/v1/spotify/me?access_token='+localStorage.getItem('access_token'))
        .then(function(response){
          return response;
        });
    } else {
      return undefined;
    }
  }
});
