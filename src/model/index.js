// Keep existing Model class for compatibility
class Model {
  static async LandingModel() {
      try {
          return "Landing Page Aura";
      } catch (err) {
          return err;
      }
  }
}

module.exports = { 
  Model
};
