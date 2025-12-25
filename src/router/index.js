"use strict";

const express = require("express");
const router = express.Router();

// controller
const { Controller } = require("../controller");

// Import auth middleware
const { Auth } = require("../middleware/auth");


// another route
const { chatMessageRouter } = require('./ChatMessageRouter');
const { userRouter } = require('./UserRouter');
const { machinesRouter } = require("./MachinesRouter");
const { AlertRouter } = require("./AlertRouter");
const { mlServiceRouter } = require("./mlServiceRouter");

// main router
router.get("/", Controller.Landing);
router.use(chatMessageRouter);
router.use(userRouter);

router.use("/api", machinesRouter);
router.use("/api/alerts", AlertRouter);
router.use("/api/ml", mlServiceRouter);

module.exports = { router };
