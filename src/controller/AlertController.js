"use strict";

const Alert = require("../model/Alert");

class AlertController {
  // GET /alerts
  static async getAllAlerts(req, res) {
    try {
      const alerts = await Alert.findAllSummary();

      res.status(200).json({
        status: "success",
        message: "Alerts summary retrieved successfully",
        data: alerts,
      });
    } catch (err) {
      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }

  // GET /alerts/:id - Get alert by ID
  static async getAlertById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          status: "error",
          message: "Valid alert ID is required",
        });
      }

      const alert = await Alert.findById(id);

      if (!alert) {
        return res.status(404).json({
          status: "error",
          message: "Alert not found",
        });
      }

      res.status(200).json({
        status: "success",
        message: "Alert retrieved successfully",
        data: alert,
      });
    } catch (err) {
      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }

  // GET /alerts/severity/:severity - Get alerts by severity
  static async getAlertsBySeverity(req, res) {
    try {
      const { severity } = req.params;

      if (
        !severity ||
        !["low", "medium", "high", "critical"].includes(severity.toLowerCase())
      ) {
        return res.status(400).json({
          status: "error",
          message:
            "Valid severity level is required (low, medium, high, critical)",
        });
      }

      const alerts = await Alert.findBySeverity(severity.toLowerCase());

      res.status(200).json({
        status: "success",
        message: `${severity} severity alerts retrieved successfully`,
        data: alerts,
      });
    } catch (err) {
      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }

  // GET /alerts/stats - Get alert statistics
  static async getAlertStats(req, res) {
    try {
      const allAlerts = await Alert.findAll();
      const unresolvedAlerts = await Alert.findUnresolved();

      // Calculate statistics
      const stats = {
        total: allAlerts.length,
        unresolved: unresolvedAlerts.length,
        resolved: allAlerts.length - unresolvedAlerts.length,
        bySeverity: {
          low: allAlerts.filter((alert) => alert.severity === "low").length,
          medium: allAlerts.filter((alert) => alert.severity === "medium")
            .length,
          high: allAlerts.filter((alert) => alert.severity === "high").length,
          critical: allAlerts.filter((alert) => alert.severity === "critical")
            .length,
        },
        unresolvedBySeverity: {
          low: unresolvedAlerts.filter((alert) => alert.severity === "low")
            .length,
          medium: unresolvedAlerts.filter(
            (alert) => alert.severity === "medium"
          ).length,
          high: unresolvedAlerts.filter((alert) => alert.severity === "high")
            .length,
          critical: unresolvedAlerts.filter(
            (alert) => alert.severity === "critical"
          ).length,
        },
      };

      res.status(200).json({
        status: "success",
        message: "Alert statistics retrieved successfully",
        data: stats,
      });
    } catch (err) {
      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }

  // PATCH /alerts/:id/resolve - Resolve alert (mark as handled)
  static async resolveAlert(req, res) {
    try {
      const { id } = req.params;
      // Safe destructuring - handle undefined body
      const resolved_by = req.body?.resolved_by;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          status: "error",
          message: "Valid alert ID is required",
        });
      }

      // Check if alert exists
      const existingAlert = await Alert.findById(id);
      if (!existingAlert) {
        return res.status(404).json({
          status: "error",
          message: "Alert not found",
        });
      }

      // Check if already resolved
      if (existingAlert.resolved) {
        return res.status(400).json({
          status: "error",
          message: "Alert is already resolved",
          data: {
            resolved_at: existingAlert.resolved_at,
            resolved_by: existingAlert.resolved_by,
          },
        });
      }

      // Get user info from auth middleware (if available)
      const resolvedBy =
        resolved_by || req.user?.email || req.user?.id || "unknown";

      const resolvedAlert = await Alert.markAsResolved(id, resolvedBy);

      res.status(200).json({
        status: "success",
        message: "Alert resolved successfully",
        data: resolvedAlert,
      });
    } catch (err) {
      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }
}

module.exports = AlertController;
