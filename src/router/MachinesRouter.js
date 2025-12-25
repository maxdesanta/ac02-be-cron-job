"use strict";

const express = require("express");
const machinesRouter = express.Router();

// Import auth middleware
const { Auth } = require("../middleware/auth");
const { MachineController } = require("../controller/MachinesController");

// Apply authentication to all machine routes
machinesRouter.use(Auth.authenticate);

// GET all machines
machinesRouter.get("/machines", MachineController.getAllMachines);

// GET machines with failures
machinesRouter.get("/machines/failures", MachineController.getMachineFailures);

// GET machine statistics
machinesRouter.get(
  "/machines/statistics",
  MachineController.getMachineStatistics
);

// GET latest machine data
machinesRouter.get("/machines/latest", MachineController.getLatestMachineData);

// GET search machine
machinesRouter.get("/machines/search", MachineController.searchMachine);

// GET machines by risk
machinesRouter.get(
  "/machines/risk/:risk",
  MachineController.filterDataByRisk
);

// GET machines by severity
machinesRouter.get(
  "/machines/severity/:severity",
  MachineController.filterDataBySeverity
)

// GET machines by type (L, M, H)
machinesRouter.get("/machines/type/:type", MachineController.getMachinesByType);

// GET machine by Id
machinesRouter.get("/machines/:id", MachineController.getMachineById);

// GET machine alerts
machinesRouter.get("/machines/:id/alerts", MachineController.getMachineAlerts);

// untuk tes
machinesRouter.post("/machines", MachineController.createMachine); // POST create machine
machinesRouter.put("/machines/:id", MachineController.updateMachine); // PUT update machine
machinesRouter.delete("/machines/:id", MachineController.deleteMachine); // DELETE machine

module.exports = { machinesRouter };
