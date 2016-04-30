import Ember from 'ember';

export default Ember.Controller.extend({
  isModalOpen: false,

  actions: {
    openModal() {
      this.set('isModalOpen', true);
    },
    
    closeModal() {
      this.set('isModalOpen', false);
    }
  }
});
