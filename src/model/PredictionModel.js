"use strict";

const { query } = require("../config/db");

class PredictionModel { 
    static async upsertPrediction(data) {
        const sql = `
            INSERT INTO machine_predictions (
                machine_id, 
                timestamp, 
                prediction, 
                confidence, 
                severity, 
                overall_health_summary, 
                diagnostics, 
                anomalies, 
                features
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (machine_id) 
            DO UPDATE SET
                timestamp = EXCLUDED.timestamp,
                prediction = EXCLUDED.prediction,
                confidence = EXCLUDED.confidence,
                severity = EXCLUDED.severity,
                overall_health_summary = EXCLUDED.overall_health_summary,
                diagnostics = EXCLUDED.diagnostics,
                anomalies = EXCLUDED.anomalies,
                features = EXCLUDED.features
            RETURNING *;
        `;

        const values = [
            data.machine_id,
            data.timestamp,
            data.prediction,
            data.confidence,
            data.severity,
            data.overall_health_summary,
            JSON.stringify(data.diagnostics),
            JSON.stringify(data.anomalies),
            JSON.stringify(data.features)
        ];

        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (err) {
            console.log(err.message);
        }
    }
};

module.exports = { PredictionModel };