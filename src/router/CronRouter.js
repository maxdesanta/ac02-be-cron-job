"use strict";

const express = require("express");
const cronRouter = express.Router();
const { runPredictionBatch } = require("../workers/PredictionWorkers");

cronRouter.get("/predict", async (req, res) => {
  // Validasi Keamanan: Memastikan request datang dari Vercel Cron
  const authHeader = req.headers['authorization'];
  
  // Di Vercel, authHeader akan otomatis mengirimkan "Bearer <CRON_SECRET>"
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Unauthorized cron attempt blocked");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    console.log("[CRON] Menjalankan batch prediksi via router...");
    await runPredictionBatch();
    res.status(200).json({ 
      success: true, 
      message: "Batch prediksi berhasil dijalankan" 
    });
  } catch (error) {
    console.error("[CRON ERROR]:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Gagal menjalankan batch prediksi",
      error: error.message 
    });
  }
});

module.exports = { cronRouter };