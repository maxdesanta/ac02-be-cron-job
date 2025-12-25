import { runPredictionBatch } from '../../src/workers/PredictionWorker';

export default async function handler(req, res) {
  // 1. Validasi Keamanan (Opsional tapi sangat disarankan)
  // Vercel mengirimkan header khusus untuk memverifikasi bahwa ini adalah request cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // 2. Jalankan logika batch yang sudah Anda buat
    await runPredictionBatch();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Batch prediksi berhasil dijalankan' 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}