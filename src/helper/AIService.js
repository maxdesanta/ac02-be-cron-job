'use strict';

require('dotenv').config();

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');

const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-2.5-flash'
});

const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", `
       Anda adalah asisten AI yang bertugas menjawab pertanyaan tentang kinerja, kondisi, dan **risiko kegagalan prediktif** mesin.
        
        Gunakan HANYA data mentah mesin berikut dalam format JSON untuk menjawab pertanyaan.
        Jangan menambah, mengurangi, atau mengasumsikan informasi di luar data ini.
        Data mencakup kolom penting seperti: machine_id, type (L, M, H), air_temperature, process_temperature, rotational_speed, torque, tool_wear, target (0=OK, 1=FAIL), failure_type, **dan objek 'prediction_result' yang berisi hasil prediksi Machine Learning (ML).**

        [DATA MESIN DATABASE DAN PREDIKSI ML]
        {databaseContext}
        [/DATA MESIN DATABASE DAN PREDIKSI ML]

        Tugas Anda adalah:
        1. Menganalisis data di atas untuk menjawab pertanyaan pengguna.
        2. Berikan jawaban yang ringkas, berdasarkan fakta, dan relevan dengan konteks prediktif.
        3. **Untuk pertanyaan mengenai risiko atau masa depan (misalnya, "mesin mana yang paling berisiko"), Anda WAJIB menganalisis data dalam objek 'prediction_result' (seperti nilai 'prediction' atau 'anomaly_score' jika tersedia) dan menggabungkannya dengan data historis.**
        4. Jika diminta, Anda dapat menghitung rata-rata, total, atau mencari data spesifik.
        5. Jawab pertanyaan pengguna HANYA berdasarkan data di atas.
        6. Jika informasi tidak ada di data tersebut, katakan **"Informasi tidak ditemukan dalam data mesin yang tersedia."**
    `],
    ["human", "{userPrompt}"]
]);

const outputParser = new StringOutputParser();
const chain = promptTemplate.pipe(llm).pipe(outputParser);

class AIService { 
    /**
     * Mengambil prompt dan mengembalikan respons teks dari AI.
     * @param {string} userPrompt - Pertanyaan dari pengguna.
     * @param {string} databaseContext - Konteks data mesin.
     * @returns {Promise<string>} - Jawaban teks dari AI.
     */

    static async generateText(userPrompt, databaseContext) {
        try {

            const resultText = await chain.invoke({
                databaseContext: databaseContext,
                userPrompt: userPrompt
            })

            return resultText;
        } catch (err) {
            console.error("ERROR DARI GOOGLE:", err);
            throw new Error(err.message);
        }
    }
};

module.exports = { AIService };