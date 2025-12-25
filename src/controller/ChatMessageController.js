"use strict";

// package lain
const PromptsValidator = require("../validator/prompt");
const InvariantError = require("../exeptions/InvariantError");
const { pusher } = require('../config/pusher');

// import model
const { ChatMessageModel } = require("../model/ChatMessageModel");
const { AIService } = require("../helper/AIService");
const { MachinesModel } = require("../model/MachinesModel");
const { PredictionService } = require("../helper/PredictionService");

class ChatMessageController {
    static async generativeAsk(req, res, next) {

        try {
            PromptsValidator.validatePromptPayload(req.body);

            const { prompt } = req.body;
            const { user } = req;

            const limit = 500; 
            const machineData = await MachinesModel.getLatest(limit);
            const machineDataWithPrediction = await PredictionService.getAllPredictions(machineData);
            const dataJson = JSON.stringify(machineDataWithPrediction);

            const resultText = await AIService.generateText(prompt, dataJson);

            const newMessage = await ChatMessageModel.inputMessageModel(user.id, prompt, resultText);

            await pusher.trigger("chat-ai", "ai-event", {
                id: newMessage.id,
                id_engineer: newMessage.id_engineer,
                message: newMessage.message,
                response: newMessage.response
            });

            res.status(200).json({
                status: "success",
                data: {
                message: resultText,
                },
            });

            next();
        } catch (err) {
        if (err instanceof InvariantError) {
            return res.status(400).json({
            status: "fail",
            message: err.message,
            });
        }

        return res.status(400).json({
            status: "fail",
            message: err.message || "Terjadi kesalahan pada server",
        });
        }
    }

    static async messageShowById(req, res, next) {
        const { user } = req;
        try {
        const result = await ChatMessageModel.messageShowByIdModel(user.id);
        res.status(200).json({
            status: "success",
            data: {
            message: result,
            },
        });
        } catch (err) {
        if (err instanceof InvariantError) {
            return res.status(400).json({
            status: "fail",
            message: err.message,
            });
        }
        }
    }
}

module.exports = { ChatMessageController };
