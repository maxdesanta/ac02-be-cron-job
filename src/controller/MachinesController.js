"use strict";

const { MachinesModel } = require("../model/MachinesModel");
const Alert = require("../model/Alert");
const PredictionService = require("../services/PredictionService");
const { calculatePaginationParameters, paginationMetadata } = require("../helper/paginationHelper");

class MachineController {
  // Get all machines
  static async getAllMachines(req, res) {
    try {
      const totalCount = await MachinesModel.getTotalCount();
      const params = calculatePaginationParameters(req.query, totalCount, 10);
      const result = await MachinesModel.findAllWithPagination(params.limit, params.offset);
      const resultCondition = await MachineController._getPrediction(result);
      const metaData = paginationMetadata({
        page: params.page,
        limit: params.limit,
        totalCount: totalCount,
        totalPages: params.totalPages
      });

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil data mesin",
        data: resultCondition,
        pagination: metaData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data mesin",
        error: error.message,
      });
    }
  }

  // Get machine by 
  static async getMachineById(req, res) {
    try {
      const { id } = req.params; // id parameter will contain udi value
      const machine = await MachinesModel.findById(id);

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: "Mesin tidak ditemukan",
        });
      }

      const machineCondition = await MachineController._getPrediction([machine]);
      const finalData = machineCondition[0];

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil data mesin",
        data: finalData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data mesin",
        error: error.message,
      });
    }
  }

  // POST - create new machine
  static async createMachine(req, res) {
    try {
      const machineData = req.body;

      const requiredFields = [
        "udi",
        "product_id",
        "type",
        "air_temperature",
        "process_temperature",
        "rotational_speed",
        "torque",
        "tool_wear",
      ];

      for (const field of requiredFields) {
        if (machineData[field] === undefined || machineData[field] === null) {
          return res.status(400).json({
            success: false,
            message: `Required field '${field}' is missing`,
          });
        }
      }

      const machine = await Machine.create(machineData);

      res.status(201).json({
        success: true,
        message: "Machine created successfully",
        data: machine,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create machine",
        error: error.message,
      });
    }
  }

  // PUT - Update machine
  static async updateMachine(req, res) {
    try {
      const { id } = req.params; // id parameter will contain udi value
      const machineData = req.body;

      const machine = await MachinesModel.update(id, machineData);

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: "Mesin tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "Mesin berhasil diperbarui",
        data: machine,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal memperbarui mesin",
        error: error.message,
      });
    }
  }

  // DELETE - Delete machine
  static async deleteMachine(req, res) {
    try {
      const { id } = req.params; // id parameter will contain udi value
      const machine = await MachinesModel.delete(id);

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: "Mesin tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "Mesin berhasil dihapus",
        data: machine,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal menghapus mesin",
        error: error.message,
      });
    }
  }

  // GET - machines by type (L, M, H)
  static async getMachinesByType(req, res) {
    try {
      const { type } = req.params;
      
      const totalCount = await MachinesModel.getCountByType(type.toUpperCase());
      const params = calculatePaginationParameters(req.query, totalCount, 10);

      if (!["L", "M", "H"].includes(type.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: "Tipe tidak valid. Harus L, M, atau H",
        });
      }

      const machines = await MachinesModel.findByTypeWithPagination(
        type.toUpperCase(),
        params.limit,
        params.offset
      );

      const machinePredictionWithType = await MachineController._getPrediction(machines);
      const metaData = paginationMetadata({
        page: params.page,
        limit: params.limit,
        totalCount: totalCount,
        totalPages: params.totalPages
      });

      res.status(200).json({
        success: true,
        message: `Mesin dengan tipe '${type}' berhasil diambil`,
        data: machinePredictionWithType,
        pagination: metaData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil mesin berdasarkan tipe",
        error: error.message,
      });
    }
  }

  // GET - machines with failures
  static async getMachineFailures(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const failures = await MachinesModel.findFailuresWithPagination(limit, offset);
      const totalCount = await MachinesModel.getFailuresCount();
      const totalPages = Math.ceil(totalCount / limit);

      res.status(200).json({
        success: true,
        message: "Mesin dengan kerusakan berhasil diambil",
        data: failures,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_records: totalCount,
          limit: limit,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil mesin dengan kerusakan",
        error: error.message,
      });
    }
  }

  // GET - machine statistics
  static async getMachineStatistics(req, res) {
    try {
      const stats = await MachinesModel.getStatistics();
      const machines = await MachinesModel.getLatestMachinesByProductId();
      const machinePredict = await MachineController._getPrediction(machines);
      const predictionStats = MachineController._calculatePredictionStats(machinePredict);

      // 5. Gabungkan semua statistik
      const combine = {
        ...stats,
        prediction_summary: predictionStats,
        total_records_processed: machinePredict.length // Total data yang diproses
      };

      res.status(200).json({
        success: true,
        message: "Statistik mesin berhasil diambil",
        data: combine,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil statistik mesin",
        error: error.message,
      });
    }
  }

  // GET - latest machine data
  static async getLatestMachineData(req, res) {
    try {
      const latestData = await MachinesModel.getLatest(500);

      res.status(200).json({
        success: true,
        message: "Data mesin terbaru berhasil diambil",
        data: latestData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data mesin terbaru",
        error: error.message,
      });
    }
  }

  // GET - machine alerts
  static async getMachineAlerts(req, res) {
    try {
      const { id } = req.params; // id parameter will contain udi value
      const alerts = await Alert.findByMachineId(id);

      res.status(200).json({
        success: true,
        message: "Peringatan mesin berhasil diambil",
        data: alerts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil peringatan mesin",
        error: error.message,
      });
    }
  }

  // GET - search machine
  static async searchMachine(req, res) {
    try {

      const { name } = req.query;
      
      const totalCount = await MachinesModel.getCountBySeacrh(name);
      const params = calculatePaginationParameters(req.query, totalCount, 10);
      const result = await MachinesModel.searchMachineByNameWithPagination(name, params.limit, params.offset);

      const resultWithConditions = await MachineController._getPrediction(result);
      
      // const totalPages = Math.ceil(totalCount / limit);
      const metaData = paginationMetadata({
        page: params.page,
        limit: params.limit,
        totalCount: totalCount,
        totalPages: params.totalPages
      });

      res.status(200).json({
        success: true,
        message: "Mesin berhasil dicari",
        data: resultWithConditions,
        pagination: metaData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mencari mesin",
        error: error.message,
      });
    }
  }

  // GET - Filter data bedasarkan Risk
  static async filterDataByRisk(req, res) { 
    try {
      const risk = req.params.risk;
      
      if (!risk) {
        return res.status(400).json({
          success: false,
          message: "Risk parameter is required",
        })
      }

      const riskUpper = risk.toUpperCase();
      
      const data = await MachinesModel.findAllWithPagination();

      const machinePredict = await MachineController._getPrediction(data);

      const filteredData = machinePredict.filter((machine) => {
        return machine.condition && machine.condition.status === riskUpper;
      });

      const totalFilterCount = filteredData.length;
      const params = calculatePaginationParameters(req.query, totalFilterCount, 10);
      const paginatedResult = filteredData.slice(params.offset, params.offset + params.limit);

      const metaData = paginationMetadata({
        page: params.page,
        limit: params.limit,
        totalCount: totalFilterCount,
        totalPages: params.totalPages
      })
    
      res.status(200).json({
        success: true,
        message: "Data mesin berhasil diambil",
        data: paginatedResult,
        pagination: metaData,
        summary: {
          total: totalFilterCount,
          filter: risk
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data mesin",
        error: error.message,
      });
    }
  }

  static async filterDataBySeverity(req, res) { 
    try {
      const { severity } = req.params;
      
      if (!severity) {
        return res.status(400).json({
          success: false,
          message: "severity parameter is required",
        })
      }

      const severityUpper = severity.toUpperCase();
      
      const data = await MachinesModel.findAllWithPagination();

      const machinePredict = await MachineController._getPrediction(data);

      const filteredData = machinePredict.filter((machine) => {
        return machine.condition && machine.condition.severity === severityUpper;
      });
      
      const totalFilterCount = filteredData.length;
      const params = calculatePaginationParameters(req.query, totalFilterCount, 10);
      const paginatedResult = filteredData.slice(params.offset, params.offset + params.limit);

      const metaData = paginationMetadata({
        page: params.page,
        limit: params.limit,
        totalCount: totalFilterCount,
        totalPages: params.totalPages
      })
    
      res.status(200).json({
        success: true,
        message: "Data mesin berhasil diambil",
        data: paginatedResult,
        pagination: metaData,
        summary: {
          total: totalFilterCount,
          filter: severity
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data mesin",
        error: error.message,
      });
    }
  }

  // mmembuat fungsi prediksi mesin
  static async _getPrediction(machines) {
    const predictionService = new PredictionService();

    return Promise.all(
      machines.map(async (machine) => {
        try {
          const machinePrediction = {
            ...machine,
            machine_id: machine.machine_id,
          };

          
          let calculatedFeatures = null;
          let condition = {
            status: "UNKNOWN",
            color: "gray",
            severity: "UNKNOWN",
            confidence: 0,
            diagnostics: null,
            anomalies: null,
            calculated_features: null
          };

          const predictionResult = await predictionService.predictMachine(machinePrediction);
          console.log(predictionResult);

          if (predictionResult.success) {
            const prediction = predictionResult.data;
            condition = {
              status: prediction.prediction,
              color: prediction.prediction === "HEALTHY" ? "green" : "red",
              severity: prediction.diagnostics.severity,
              confidence: prediction.confidence,
              overall_health: prediction.overall_health,
              diagnostics: prediction.diagnostics,
              anomalies: prediction.anomalies,
            };

            if (prediction.features) { 
              calculatedFeatures = {};
              calculatedFeatures.Temperature_Diff = prediction.features.Temperature_Diff;
              calculatedFeatures.Power_W = prediction.features.Power_W;
            }
          }

          return {
            machine_id: machine.machine_id,
            type: machine.type,
            air_temperature: parseFloat(machine.air_temperature),
            process_temperature: parseFloat(machine.process_temperature),
            rotational_speed: parseInt(machine.rotational_speed),
            torque: parseFloat(machine.torque),
            tool_wear: parseInt(machine.tool_wear),
            timestamp: machine.timestamp,
            condition: condition,
            calculated_features: calculatedFeatures,
            target: machine.target,
            failure_type: machine.failure_type,
          };

        } catch (error) {
          console.error(
            `Error saat memprediksi mesin ${machine.machine_id}:`,
            error
          );
          
          return {
              ...machine,
              condition: {
                  status: "ERROR",
                  color: "orange",
                  severity: "UNKNOWN",
                  confidence: 0,
                  error: error.message,
                  diagnostics: null,
                  anomalies: null
            },
            calculated_features: null
          };
        }
      })
    )
  }

  static _calculatePredictionStats(machinePredictions) {
    const predictionStats = {
      status: {
        HEALTHY: 0,
        FAILURE: 0,
        UNKNOWN: 0,
        ERROR: 0
      },
      severity: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
        UNKNOWN: 0, // Untuk kasus HEALTHY/UNKNOWN
        ERROR: 0
      }
    };

    for (const machine of machinePredictions) {
      const status = machine.condition && machine.condition.status ? machine.condition.status.toUpperCase() : "UNKNOWN";
      const severity = machine.condition && machine.condition.severity ? machine.condition.severity.toUpperCase() : "UNKNOWN";

      if (predictionStats.status[status] !== undefined) {
        predictionStats.status[status]++;
      } else {
        predictionStats.status.UNKNOWN++;
      }

      if (predictionStats.severity[severity] !== undefined) {
        predictionStats.severity[severity]++;
      } else {
        predictionStats.severity.UNKNOWN++;
      }
    }

    return predictionStats;
  }
}

module.exports = { MachineController };