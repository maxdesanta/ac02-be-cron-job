class PredictionService {
  constructor() {
    this.mlServiceUrl = process.env.ML_PREDICTION_URL || "https://deropxyz-ac02-ml.hf.space";
  }

  /**
   * Predict machine failure using ML service
   * @param {Object} machineData - Machine sensor data
   * @returns {Promise<Object>} Prediction result
   */
  async predictMachine(machineData) {
    try {
      // memastikan machine_id selalu string, prioritaskan product_id
      const machineId = machineData.machine_id;

      const predictionPayload = {
        machine_id: machineId,
        air_temperature: parseFloat(machineData.air_temperature),
        process_temperature: parseFloat(machineData.process_temperature),
        rotational_speed: parseInt(machineData.rotational_speed),
        torque: parseFloat(machineData.torque),
        tool_wear: parseInt(machineData.tool_wear),
        type: machineData.type,
      };

      console.log("URL ML Service yang digunakan:", `${this.mlServiceUrl}/predict`); 
      console.log("mengirim data ke service ML:", predictionPayload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); 
      const response = await fetch(`${this.mlServiceUrl}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(predictionPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("API ML Response NOT OK. Status:", response.status); 
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.detail || `HTTP Error: ${response.status}`,
          status: response.status,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      // LOG INI AKAN MUNCUL DI LOG VERCEL
      console.error("error pada service ML prediksi:", error.message);
      console.error("Nama Error yang Tertangkap:", error.name);
      console.error("URL yang Digunakan:", this.mlServiceUrl + "/predict");

  // Jika error.message mengandung 'fetch'
  if (error.message.includes("fetch")) {
      return { 
          success: false, 
          error: "service ML tidak dapat dijangkau", 
          status: 503 
      };
  }

      if (error.name === "AbortError") {
        return {
          success: false,
          error:
            "Request timeout - service ML membutuhkan waktu terlalu lama untuk merespon",
          status: 408,
        };
      } else if (error.message.includes("fetch")) {
        return {
          success: false,
          error: "service ML tidak dapat dijangkau",
          status: 503,
        };
      } else {
        return {
          success: false,
          error: "Gagal melakukan prediksi mesin",
          status: 500,
        };
      }
    }
  }
}

module.exports = { PredictionService };