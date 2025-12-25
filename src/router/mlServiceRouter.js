"use strict";

const express = require("express");
const mlServiceRouter = express.Router();

const { Auth } = require("../middleware/auth");
const MLServiceController = require("../controller/MLServiceController");

mlServiceRouter.use(Auth.authenticate);

// GET all machine dengan hasil prediksi (untuk dashboard)
mlServiceRouter.get(
  "/machines/condition",
  MLServiceController.getAllMachinesCondition
);

// GET machine by id dengan sensor data terbaru untuk prediksi
mlServiceRouter.get(
  "/machines/:id/predict",
  MLServiceController.getMachineForPrediction
);

// POST prediksi mesin berdasarkan data sensor terbaru
mlServiceRouter.post(
  "/machines/:id/predict",
  MLServiceController.predictMachine
);

module.exports = { mlServiceRouter };
