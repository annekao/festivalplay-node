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
        this.get('selectedEvent').artists.forEach(function(artist) {
          var genre = '';
          if (artist.genres) {
            genre = ' (' + artist.genres[0].name + ')';
          }
          this.get('artistResults').addObject(artist.name + genre);
          this.get('selectedArtists').addObject(artist.name + genre);
        }.bind(this));
      }
    }
  }
});
