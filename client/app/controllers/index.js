import Ember from 'ember';

export default Ember.Controller.extend({
  isModalOpen: false,
  eventQuery: '',
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
      $.getJSON('http://localhost:8000/api/v1/seatgeek/events?q='+this.get('search'))
        .then(function(response){
          console.log(response);
        });
      this.set('step2', true);
      this.set('step1', false);
    },

    step3() {
      this.set('step3', true);
      this.set('step2', false);
    }
  }
});
