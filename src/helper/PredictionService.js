'use strict';
require('dotenv').config();

const PREDICTION_API_URL = "https://deropxyz-ac02-ml.hf.space/predict";

class PredictionService { 
    /**
     * Memanggil API ML untuk mendapatkan prediksi untuk satu mesin.
     * @param {object} machineData - Objek yang berisi data sensor terbaru mesin.
     * @returns {Promise<object>} - Hasil prediksi atau objek error.
     */
    static async getPrediction(machineData) {
        const { default: fetch } = await import('node-fetch');

        const machineId = machineData.machine_id;

        if (!machineId) {
            console.error("machine_id is missing.");
            return { error: "Missing machine_id in payload" };
        }

        const payload = {
            machine_id: machineId,
            air_temperature: parseFloat(machineData.air_temperature),
            process_temperature: parseFloat(machineData.process_temperature),
            rotational_speed: parseFloat(machineData.rotational_speed),
            torque: parseFloat(machineData.torque),
            tool_wear: parseInt(machineData.tool_wear),
            type: machineData.type
        };


        try {
            const response = await fetch(PREDICTION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Tangani respons HTTP non-OK (misalnya 4xx atau 5xx)
                console.error(`Gagal mendapatkan prediksi untuk ${response.machine_id}: HTTP Status ${response.status}`);
                return { 
                    error: `API ML mengembalikan status ${response.status}`,
                    prediction_result: 'Not Available'
                };
            }

            const data = await response.json();

            return data;

        } catch (error) {
            console.error(`Error saat memanggil API ML untuk ${machineId}: ${error.message}`);
            
            // 🚨 LOGGING KRUSIAL: Cetak stack trace penuh
            console.error("DEBUG: Full Stack Trace for Reference Error:", error.stack); 
            
            return {
                error: `Gagal koneksi atau jaringan ke API ML: ${error.message}`,
                status: 'Network Error'
            };
        }
    }

    /**
     * Mengambil prediksi untuk seluruh daftar mesin secara paralel.
     * @param {Array<object>} machineList - Daftar data mesin terbaru.
     * @returns {Promise<Array<object>>} - Daftar data mesin yang diperkaya dengan hasil prediksi.
     */

    static async getAllPredictions(machineList) {
        console.log(`Mengambil prediksi untuk ${machineList.length} mesin.`);

        if (!Array.isArray(machineList)) {
            console.warn("[MLService] Input data is not a valid array.");
            return [];
        }

        const predictionPromises = machineList
        // 1. Filter: Hanya elemen array yang merupakan objek dan memiliki machine_id yang akan diproses
        .filter(machine => 
            machine && typeof machine === 'object' && machine.machine_id 
        )
        // 2. Map: Buat Promise API call
        .map(async machine => {
            // Kita bungkus pemanggilan API di try/catch di sini juga
            try {
                const predictionResult = await this.getPrediction(machine);
                return {
                    ...machine,
                    prediction_result: predictionResult 
                };
            } catch (apiError) {
                console.error(`[MLService] Failed to get prediction for ${machine.machine_id}:`, apiError.message);
                return {
                    ...machine,
                    prediction_result: { error: "API call failed" }
                };
            }
        });

        return Promise.all(predictionPromises)
    }
};

module.exports = { PredictionService };