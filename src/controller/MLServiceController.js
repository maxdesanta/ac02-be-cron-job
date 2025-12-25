const PredictionService = require("../services/PredictionService");
// const Machine = require("../model/machine");
const { MachinesModel } = require("../model/MachinesModel");
const AlertService = require("../services/AlertService");

const alertProcessingCache = new Map();
const ALERT_PROCESSING_TTL = 60000; // 1 minute

// Helper function untuk cache management
function isAlertBeingProcessed(machineId) {
  const cacheKey = `alert_processing_${machineId}`;
  const cached = alertProcessingCache.get(cacheKey);

  if (cached && Date.now() - cached < ALERT_PROCESSING_TTL) {
    return true;
  }

  // Clean expired cache
  if (cached) {
    alertProcessingCache.delete(cacheKey);
  }

  return false;
}

function setAlertProcessingFlag(machineId) {
  const cacheKey = `alert_processing_${machineId}`;
  alertProcessingCache.set(cacheKey, Date.now());
}

function clearAlertProcessingFlag(machineId) {
  const cacheKey = `alert_processing_${machineId}`;
  alertProcessingCache.delete(cacheKey);
}

// Cleanup expired cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of alertProcessingCache.entries()) {
    if (now - timestamp > ALERT_PROCESSING_TTL) {
      alertProcessingCache.delete(key);
    }
  }
}, 60000); // Cleanup every minute

class MLServiceController {
  // Get all machines dengan hasil prediksi (untuk dashboard)
  // Auto-generate alerts untuk machines
  static async getAllMachinesCondition(req, res) {
    try {
      console.log("Getting all machines with condition...");
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Get latest machine data grouped by product_id
      const latestMachines = await MachinesModel.getLatestMachinesByProductId();
      console.log("Latest machines found:", latestMachines.length);

      if (latestMachines.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Tidak ada data mesin yang ditemukan dalam database",
          debug: {
            checked_method: "Machine.getLatestMachinesByProductId()",
            result_count: latestMachines.length,
          },
        });
      }

      // Initialize prediction service
      const predictionService = new PredictionService();

      // Get predictions for each machine
      const machinesCondition = await Promise.all(
        latestMachines
          .slice((page - 1) * limit, page * limit)
          .map(async (machine) => {
            try {
              const machineForPrediction = {
                ...machine,
                machine_id: machine.machine_id,
              };

              console.log(`[1] Predicting machine: ${machine.machine_id}`);

              const predictionResult = await predictionService.predictMachine(
                machineForPrediction
              );

              let condition = {
                status: "UNKNOWN",
                color: "gray",
                severity: "UNKNOWN",
                confidence: 0,
              };

              if (predictionResult.success) {
                console.log(`[2] Prediction SUCCESS for ${machine.machine_id}. Prediction: ${predictionResult.data.prediction}`);
                const prediction = predictionResult.data;
                condition = {
                  status: prediction.prediction, // HEALTHY or FAILURE
                  color: prediction.prediction === "HEALTHY" ? "green" : "red",
                  severity: prediction.diagnostics.severity,
                  confidence: prediction.confidence,
                  overall_health: prediction.overall_health,
                };

                // Generate alert in background (fire and forget - tidak menunggu)
                MLServiceController.generateAlertInBackground(
                  machineForPrediction ,
                  predictionResult
                );
              } else {
                console.log(`[2] Prediction SUCCESS for ${machine.machine_id}. Prediction: ${predictionResult.data.prediction}`);
              }

              return {
                id: machine.id,
                machine_id: machine.machine_id,
                type: machine.type,
                air_temperature: parseFloat(machine.air_temperature),
                process_temperature: parseFloat(machine.process_temperature),
                rotational_speed: parseInt(machine.rotational_speed),
                torque: parseFloat(machine.torque),
                tool_wear: parseInt(machine.tool_wear),
                timestamp:
                  machine.timestamp || machine.updated_at || machine.created_at,
                condition: condition,
                target: machine.target,
                failure_type: machine.failure_type,
              };
            } catch (error) {
              console.error(
                `Error saat memprediksi mesin ${machine.product_id}:`,
                error
              );
              return {
                id: machine.id,
                machine_id: machine.product_id,
                type: machine.type,
                air_temperature: parseFloat(machine.air_temperature),
                process_temperature: parseFloat(machine.process_temperature),
                rotational_speed: parseInt(machine.rotational_speed),
                torque: parseFloat(machine.torque),
                tool_wear: parseInt(machine.tool_wear),
                timestamp:
                  machine.timestamp || machine.updated_at || machine.created_at,
                condition: {
                  status: "ERROR",
                  color: "orange",
                  severity: "UNKNOWN",
                  confidence: 0,
                  error: error.message,
                },
                target: machine.target,
                failure_type: machine.failure_type,
              };
            }
          })
      );

      const totalCount = latestMachines.length;
      const totalPages = Math.ceil(totalCount / limit);

      // Calculate summary dari SEMUA machines (bukan hanya page saat ini)
      // Untuk performance, predict semua machines di background untuk summary
      const allMachinesPredictions = await Promise.all(
        latestMachines.map(async (machine) => {
          try {
            const machineForPrediction = {
              ...machine,
              machine_id: machine.machine_id,
            };

            const predictionResult = await predictionService.predictMachine(
              machineForPrediction
            );

            if (predictionResult.success) {
              // Generate alert in background untuk SEMUA mesin (bukan hanya page saat ini)
              MLServiceController.generateAlertInBackground(
                machineForPrediction,
                predictionResult
              );

              return {
                status: predictionResult.data.prediction,
                severity: predictionResult.data.diagnostics.severity,
                confidence: predictionResult.data.confidence,
              };
            }
            return { status: "ERROR", severity: "UNKNOWN", confidence: 0 };
          } catch (error) {
            return { status: "ERROR", severity: "UNKNOWN", confidence: 0 };
          }
        })
      );

      // Count by status
      const healthyCount = allMachinesPredictions.filter(
        (p) => p.status === "HEALTHY"
      ).length;
      const failureCount = allMachinesPredictions.filter(
        (p) => p.status === "FAILURE"
      ).length;
      const errorCount = allMachinesPredictions.filter(
        (p) => p.status === "ERROR"
      ).length;

      // Count by severity/risk
      const criticalCount = allMachinesPredictions.filter(
        (p) => p.severity === "CRITICAL"
      ).length;
      const highCount = allMachinesPredictions.filter(
        (p) => p.severity === "HIGH"
      ).length;
      const mediumCount = allMachinesPredictions.filter(
        (p) => p.severity === "MEDIUM"
      ).length;
      const lowCount = allMachinesPredictions.filter(
        (p) => p.severity === "LOW"
      ).length;

      const response = {
        success: true,
        message:
          "Berhasil mengambil data mesin dengan hasil prediksi dari ML service",
        data: machinesCondition,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_records: totalCount,
          limit: limit,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
        summary: {
          total_machines: totalCount,
          by_status: {
            healthy: healthyCount,
            failure: failureCount,
            error: errorCount,
          },
          by_severity: {
            critical: criticalCount,
            high: highCount,
            medium: mediumCount,
            low: lowCount,
          },
          average_confidence:
            allMachinesPredictions.reduce((acc, p) => acc + p.confidence, 0) /
            allMachinesPredictions.length,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Gagal mengambil data mesin dengan hasil prediksi dari ML service",
        error: error.message,
      });
    }
  }

  // Get machine dengan data sensor terbaru untuk di prediksi
  static async getMachineForPrediction(req, res) {
    try {
      const { id } = req.params; // machine UDI or product_id

      const machine = await MachinesModel.findById(id);

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: "Mesin tidak ditemukan",
        });
      }

      // Return machine data for prediksi
      res.status(200).json({
        success: true,
        message: "Berhasil mengambil data mesin untuk prediksi",
        data: {
          machine_id: machine.product_id,
          udi: machine.udi,
          product_id: machine.product_id,
          type: machine.type,
          sensor_data: {
            air_temperature: parseFloat(machine.air_temperature),
            process_temperature: parseFloat(machine.process_temperature),
            rotational_speed: parseInt(machine.rotational_speed),
            torque: parseFloat(machine.torque),
            tool_wear: parseInt(machine.tool_wear),
            timestamp: machine.updated_at || machine.created_at,
          },
          prediction_ready: true,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data mesin",
        error: error.message,
      });
    }
  }

  // prediksi mesin berdasarkan data sensor terbaru
  static async predictMachine(req, res) {
    try {
      const { id } = req.params; // machine UDI atau product_id

      // Get machine data
      const machine = await MachinesModel.findById(id); 

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: "Mesin tidak ditemukan",
        });
      }

      // Initialize prediction service
      const predictionService = new PredictionService();

      // menyiapkan data mesin untuk prediksi
      const machineForPrediction = {
        ...machine,
        machine_id: machine.machine_id, 
      };

      console.log("Machine data for prediction:", machineForPrediction);

      // Call ML service for prediction
      const predictionResult = await predictionService.predictMachine(
        machineForPrediction
      );

      if (!predictionResult.success) {
        return res.status(predictionResult.status || 500).json({
          success: false,
          message: "Gagal melakukan prediksi",
          error: predictionResult.error,
          ml_service_error: true,
        });
      }

      res.status(200).json({
        success: true,
        message: "Prediksi berhasil dilakukan",
        machine_data: {
          machine_id: machine.machine_id, 
          type: machine.type,
          sensor_data: {
            air_temperature: parseFloat(machine.air_temperature),
            process_temperature: parseFloat(machine.process_temperature),
            rotational_speed: parseInt(machine.rotational_speed),
            torque: parseFloat(machine.torque),
            tool_wear: parseInt(machine.tool_wear),
            timestamp: machine.updated_at || machine.created_at,
          },
        },
        prediction: predictionResult.data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal melakukan prediksi",
        error: error.message,
      });
    }
  }

  static generateAlertInBackground(machine, predictionResult) {
    // Fire and forget - async IIFE
    (async () => {
      try {
        const machineId = machine.machine_id;

        console.log(`\n[ALERT-GEN] Starting for machine: ${machineId}`);

        // predictionResult has structure: {success: true, data: {prediction, diagnostics, confidence, ...}}
        const prediction = predictionResult.data || predictionResult;
        console.log(
          `[ALERT-GEN] Prediction: ${prediction.prediction}, Severity: ${prediction.diagnostics?.severity}, Confidence: ${prediction.confidence}`
        );

        // Check if alert is already being processed
        if (!isAlertBeingProcessed(machineId)) {
          setAlertProcessingFlag(machineId);

          try {
            console.log(`[ALERT-GEN] Processing alert for ${machineId}...`);
            const result = await AlertService.generateMLBasedAlert(
              machine,
              predictionResult
            );
            console.log(`[ALERT-GEN] Result for ${machineId}:`, {
              success: result.success,
              message: result.message,
              alertCreated: result.alertCreated,
              duplicate: result.duplicate || false,
            });
          } finally {
            clearAlertProcessingFlag(machineId);
          }
        } else {
          console.log(
            `[ALERT-GEN] Skipped ${machineId} - already being processed`
          );
        }
      } catch (error) {
        console.error(
          `[ALERT-GEN] ERROR for ${machine.product_id}:`,
          error.message
        );
        console.error(`[ALERT-GEN] Stack:`, error.stack);
      }
    })();
  }
}

module.exports = MLServiceController;
