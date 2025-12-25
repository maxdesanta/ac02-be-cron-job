const cron = require('node-cron');
const { MachinesModel } = require('../model/MachinesModel');

const { PredictionService } = require('../services/PredictionService');
const { PredictionModel } = require('../model/PredictionModel');
const predictionService = new PredictionService();


async function runPredictionBatch() {
    console.log(`[CRON] Memulai batch prediksi pada: ${new Date().toISOString()}`);
    
    try {
        const machines = await  MachinesModel.findAll();

        if (!machines || machines.length === 0) {
            console.log('[CRON] Tidak ada mesin yang tersedia.');
            return;
        }

        console.log(`[CRON] Mendapatkan ${machines.length} mesin.`);

        const predictionsLoop = machines.map(async machine => {
            const result = await predictionService.predictMachine(machine);
            
            if (result.success) {
                const prediction = result.data;

                const upsertData = {
                    machine_id: prediction.machine_id,
                    timestamp: prediction.timestamp,
                    prediction: prediction.prediction.toUpperCase(),
                    confidence: prediction.confidence,
                    severity: prediction.diagnostics.severity.toUpperCase(), 
                    overall_health_summary: prediction.overall_health,
                    diagnostics: prediction.diagnostics, 
                    anomalies: prediction.anomalies,   
                    features: prediction.features
                };

                await PredictionModel.upsertPrediction(upsertData);
            } else {
                console.error(`[CRON] Gagal mendapatkan prediksi mesin: ${result.message}`);
            }
        });

        await Promise.all(predictionsLoop);
        console.log(`[CRON] Batch prediksi selesai pada: ${new Date().toISOString()}`);

    } catch (error) {
        console.error(`[CRON] Gagal mendapatkan daftar mesin: ${error.message}`);
    }
};

function startPredictionSheduler() {
    cron.schedule('*/5 * * * *', () => {
        runPredictionBatch();
    }, {
        scheduled: true,
        timezone: 'Asia/Jakarta'
    });

    runPredictionBatch();
    console.log(`[CRON] Cron job telah dimulai pada: ${new Date().toISOString()}`);
}

module.exports = { startPredictionSheduler, runPredictionBatch };