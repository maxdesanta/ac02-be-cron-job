const Alert = require("../model/Alert");

class AlertService {
  // Check if machine has recent unresolved alerts to prevent spam
  static async hasRecentUnresolvedAlert(
    machineId,
    alertType,
    timeWindowMinutes = 10
  ) {
    try {
      const alerts = await Alert.findByMachineId(machineId);
      const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      return alerts.some(
        (alert) =>
          alert.type === alertType &&
          alert.resolved === false && // Explicitly check resolved column
          new Date(alert.created_at) > cutoffTime
      );
    } catch (error) {
      console.error("Error checking recent alerts:", error);
      return false;
    }
  }
  /**
   * Generate alerts berdasarkan ML prediction results
   * @param {Object} machineData - Data mesin
   * @param {Object} predictionResult - Hasil prediksi ML
   * @returns {Promise<Object>} Alert result
   */
  static async generateMLBasedAlert(machineData, predictionResult) {
    try {
      const machineId = machineData.machine_id;
      console.log(`[3] Alert Service running for machine: ${machineId}`);
      
      if (!predictionResult.success || !predictionResult.data) {
        return {
          success: false,
          message: "Prediction data tidak valid untuk generate alert",
        };
      }

      const prediction = predictionResult.data;
      const diagnostics = prediction.diagnostics;
      const anomalies = prediction.anomalies || [];

      // Tentukan apakah perlu membuat alert berdasarkan kondisi ML
      const shouldCreateAlert = this.shouldCreateMLAlert(
        prediction,
        diagnostics
      );

      console.log(`[4] Should Create Alert for ${machineId}: ${shouldCreateAlert}`);

      if (!shouldCreateAlert) {
        return {
          success: true,
          message: "Kondisi mesin normal, tidak perlu alert",
          alertCreated: false,
        };
      }

      // Cek duplicate alert dalam 1 jam terakhir
      const isDuplicate = await this.hasRecentUnresolvedAlert(
        machineData.machine_id,
        this.determineMLAlertType(prediction, diagnostics, anomalies),
        60 // 60 menit
      );

      console.log(`[5] Is Duplicate Alert for ${machineId} (Type: ${this.determineMLAlertType(prediction, diagnostics, anomalies)}): ${isDuplicate}`);

      if (isDuplicate) {
        return {
          success: true,
          message: "Alert serupa sudah ada, skip duplicate",
          alertCreated: false,
          duplicate: true,
        };
      }

      // Buat alert data
      const alertData = {
        machine_id: machineData.machine_id,
        type: this.determineMLAlertType(prediction, diagnostics, anomalies),
        severity: this.mapMLSeverityToAlert(diagnostics.severity),
        message: this.generateMLAlertMessage(
          machineData,
          prediction,
          diagnostics,
          anomalies
        ),
        data: {
          ml_prediction: {
            prediction: prediction.prediction,
            confidence: prediction.confidence,
            overall_health: prediction.overall_health,
          },
          diagnostics: diagnostics,
          anomalies: anomalies,
          machine_data: {
            machine_id: machineData.machine_id,
            type: machineData.type,
            sensor_values: {
              air_temperature: machineData.air_temperature,
              process_temperature: machineData.process_temperature,
              rotational_speed: machineData.rotational_speed,
              torque: machineData.torque,
              tool_wear: machineData.tool_wear,
            },
          },
          timestamp: new Date().toISOString(),
          alert_source: "ML_PREDICTION",
          auto_generated: true,
        },
      };

      console.log(`[6] Creating Alert in DB for ${machineId}. Type: ${alertData.type}, Severity: ${alertData.severity}`);

      // Buat alert
      const alert = await Alert.create(alertData);

      console.log(`[7] Alert successfully created for ID: ${alert.id}`);

      return {
        success: true,
        message: "Alert berhasil dibuat",
        alertCreated: true,
        alert: alert,
      };
    } catch (error) {
      console.error("Error generating alert:", error);
      return {
        success: false,
        message: "Gagal membuat alert",
        error: error.message,
      };
    }
  }

  static shouldCreateMLAlert(prediction, diagnostics) {
    // Buat alert jika:
    // 1. Prediksi FAILURE
    // 2. Severity CRITICAL atau HIGH
    // 3. Confidence rendah pada prediction HEALTHY (anomali)

    if (prediction.prediction === "FAILURE") {
      return true;
    }

    if (["CRITICAL", "HIGH"].includes(diagnostics.severity)) {
      return true;
    }

    // Anomali: HEALTHY tapi confidence rendah
    if (prediction.prediction === "HEALTHY" && prediction.confidence < 0.7) {
      return true;
    }

    return false;
  }

  // Tentukan tipe alert berdasarkan ML diagnostics
  static determineMLAlertType(prediction, diagnostics, anomalies) {
    if (prediction.prediction === "FAILURE") {
      return "ML_FAILURE_PREDICTED";
    }

    const primaryCause = diagnostics.primary_cause.toLowerCase();

    if (primaryCause.includes("tool")) {
      return "ML_TOOL_WEAR_WARNING";
    }

    if (primaryCause.includes("power") || primaryCause.includes("overstrain")) {
      return "ML_POWER_ANOMALY";
    }

    if (primaryCause.includes("heat") || primaryCause.includes("temperature")) {
      return "ML_THERMAL_WARNING";
    }

    if (anomalies && anomalies.length > 0) {
      return "ML_SENSOR_ANOMALY";
    }

    return "ML_MAINTENANCE_WARNING";
  }

  // Map ML severity ke alert severity
  static mapMLSeverityToAlert(mlSeverity) {
    const severityMap = {
      CRITICAL: "critical",
      HIGH: "high",
      MEDIUM: "medium",
      LOW: "low",
    };

    return severityMap[mlSeverity] || "medium";
  }

  // Generate alert message dari ML prediction
  static generateMLAlertMessage(
    machineData,
    prediction,
    diagnostics,
    anomalies
  ) {
    const machineId = machineData.product_id || machineData.machine_id;
    const confidence = Math.round(prediction.confidence * 100);

    let message = `[ML ALERT] ${machineId}: ${diagnostics.primary_cause}\n`;
    message += `Prediksi: ${prediction.prediction} (${confidence}% confidence)\n`;
    message += `Status: ${diagnostics.severity}\n`;
    message += `Sensor Alert: ${diagnostics.sensor_alert}\n`;
    message += `Rekomendasi: ${diagnostics.recommended_action}`;

    if (anomalies && anomalies.length > 0) {
      message += `\n\nAnomalies terdeteksi:`;
      anomalies.forEach((anomaly) => {
        message += `\n- ${anomaly.parameter}: ${anomaly.value} (${anomaly.status}) - ${anomaly.explanation}`;
      });
    }

    return message;
  }

  // Batch generate ML alerts untuk semua machines
  static async generateBatchMLAlerts() {
    try {
      const Machine = require("../model/machine");
      const PredictionService = require("./PredictionService");

      const predictionService = new PredictionService();
      const machines = await Machine.getLatestMachinesByProductId();

      const results = {
        processed: 0,
        alertsCreated: 0,
        errors: 0,
        duplicates: 0,
        skipped: 0,
      };

      for (const machine of machines) {
        try {
          console.log(
            `Processing machine: ${machine.product_id}, UDI: ${machine.udi}`
          );

          // Get ML prediction
          const machineForPrediction = {
            ...machine,
            machine_id: machine.product_id,
            product_id: machine.product_id,
            udi: machine.udi,
          };

          console.log(
            `Calling ML prediction for machine: ${machine.product_id}`
          );
          const predictionResult = await predictionService.predictMachine(
            machineForPrediction
          );

          console.log(
            `Prediction result for ${machine.product_id}:`,
            predictionResult
          );

          if (predictionResult.success) {
            console.log(`Generating alert for machine: ${machine.product_id}`);
            const alertResult = await this.generateMLBasedAlert(
              machine,
              predictionResult
            );

            console.log(`Alert result for ${machine.product_id}:`, alertResult);

            if (alertResult.alertCreated) {
              results.alertsCreated++;
            } else if (alertResult.duplicate) {
              results.duplicates++;
            } else {
              results.skipped++;
            }
          } else {
            console.log(
              `Prediction failed for machine ${machine.product_id}:`,
              predictionResult.error
            );
            results.errors++;
          }

          results.processed++;
        } catch (error) {
          console.error(
            `Error processing ML alert for machine ${machine.product_id}:`,
            error
          );
          results.errors++;
        }
      }

      return {
        success: true,
        message: "Batch ML alert generation completed",
        results: results,
      };
    } catch (error) {
      console.error("Error in batch ML alert generation:", error);
      return {
        success: false,
        message: "Batch ML alert generation failed",
        error: error.message,
      };
    }
  }
}

module.exports = AlertService;
