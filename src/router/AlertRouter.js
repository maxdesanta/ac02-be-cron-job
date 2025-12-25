"use strict";

const express = require("express");
const AlertController = require("../controller/AlertController");

// Import auth middleware
const { Auth } = require("../middleware/auth");

const AlertRouter = express.Router();

// Apply authentication to all alert routes
AlertRouter.use(Auth.authenticate);

// GET /alerts/stats - Get alert statistics
AlertRouter.get("/stats", AlertController.getAlertStats);

// GET /alerts/severity/:severity - Get alerts by severity
AlertRouter.get("/severity/:severity", AlertController.getAlertsBySeverity);

// GET /alerts - Get all alerts
AlertRouter.get("/", AlertController.getAllAlerts);

// GET /alerts/:id - Get alert by ID
AlertRouter.get("/:id", AlertController.getAlertById);

// PATCH /alerts/:id/resolve - Resolve alert (mark as handled)
AlertRouter.patch("/:id/resolve", AlertController.resolveAlert);

module.exports = { AlertRouter };
