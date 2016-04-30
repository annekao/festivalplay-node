import Ember from 'ember';

export default Ember.Controller.extend({
  isModalOpen: false,
  eventResults: [],
  selectedEvent: '',
  artistResults: [],
  selectedArtists: [],
  step1: true,
  step2: false,
  step3: false,
  step4: false,
  range: 6,
  creating: false,
  progress: '',
  errors: false,
  errorMessages: [],

  actions: {
    openModal() {
      if ((new Date()).getTime() > localStorage.getItem('access_token_expires')) {
        alert("Your Spotify session has expired");
        this.transitionToRoute('index');
      } else {
        this.set('isModalOpen', true);
      }
    },
    
    closeModal() {
      this.set('isModalOpen', false);
    },

    step1() {
      this.set('step1', true);
      this.set('step2', false);
      this.set('selectedEvent', '');
    },

    step2() {
      this.set('step2', true);
      this.set('step1', false);
      this.set('step3', false);
      if(this.get('selectedEvent') === '') {
        $.getJSON('http://localhost:8000/api/v1/seatgeek/events?q='+this.get('search'))
          .then(function(response){
            this.set('eventResults', response);
          }.bind(this));
      }
    },

    selectEvent(selectedEvent) {
      this.set('selectedEvent', selectedEvent);
      this.get('eventResults').forEach(function(event) {
        if (event.id === selectedEvent.id) {
          Ember.set(event, 'selected', true);
        } else {
          Ember.set(event, 'selected', false);
        }
      })
    },

    step3() {
      if (this.get('selectedEvent') === '') {
        alert('Select an event!');
      } else {
        this.set('step3', true);
        this.set('step2', false);
        this.set('step4', false);
        this.get('selectedEvent').artists.forEach(function(artist) {
          this.get('artistResults').addObject(artist.name);
          this.get('selectedArtists').addObject(artist.name);
        }.bind(this));
      }
    },

    step4() {
      this.set('step4', true);
      this.set('step3', false);
    },

    createPlaylist() {
      this.set('creating', true);
      this.set('step4', false);

      this.set('progress', 'Searching for artists in Spotify...');

      this.get('selectedArtists').forEach(function(artist) {
        $.getJSON('http://localhost:8000/api/v1/spotify/search?q='+artist)
          .then(function(response){
            if (response.error) {
              this.set('errors', true);
              this.get('errorMessages').addObject(response.error);
            }
          }.bind(this));
      }.bind(this));

      this.set('progress', 'Finding the top ' + this.get('range') + ' tracks for each artist...');
      this.set('progress', 'Creating playlist...');
    }
  }
});
