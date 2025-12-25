"use strict";

const { Model } = require("../model/index");
class Controller {
  static async Landing(req, res, next) {
    try {
      const result = await Model.LandingModel();
      res.json(result);
    } catch (err) {
      res.json({
        message: err.message,
      });
    }
  }
}

module.exports = { Controller };
