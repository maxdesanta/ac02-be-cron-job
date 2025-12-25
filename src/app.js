"use strict";

require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");

// import cron
const { startPredictionSheduler } = require('./workers/PredictionWorkers');

// router
const { router } = require("./router");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(router);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);

  try {
    startPredictionSheduler(); 
    console.log('[SCHEDULER] Sistem Prediksi Batch (Cron Job) telah diaktifkan.');
  } catch (error) {
    console.error('[SCHEDULER] Gagal mengaktifkan Prediction Scheduler:', error);
  }
});