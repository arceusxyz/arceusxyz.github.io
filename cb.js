// callback_qris.js
import express from "express";
import fs from "fs";
import axios from "axios";

const app = express();
app.use(express.json());

// === KONFIGURASI ===
const TELEGRAM_BOT_TOKEN = "8373193996:AAEsoV8wPxdaFO3pp5IcDeANc7IIGQNuKQ4";
const TELEGRAM_CHAT_ID = "6233785210"; // contoh: -1001234567890 (kalau grup)
const LOG_FILE = "logs/callback.log";

function writeLog(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage, "utf8");
}

// === ROUTE CALLBACK ===
app.post("/callback_qris", async (req, res) => {
  const data = req.body;

  // --- Validasi input wajib ---
  const requiredFields = [
    "terminal_id",
    "trx_id",
    "amount",
    "custom_ref",
    "created_at",
    "status",
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      const msg = `❌ Missing field: ${field}. Data: ${JSON.stringify(data)}`;
      writeLog(msg);
      return res.status(400).json({ success: false, message: msg });
    }
  }

  // --- Ambil data utama ---
  const userqris = data.terminal_id.trim();
  const trxid = data.trx_id.trim();
  const amount = Number(data.amount);
  const custom_ref = data.custom_ref.trim();
  const created_at = data.created_at.trim();
  const status = data.status.toLowerCase();

  // --- Logging awal ---
  writeLog(`Callback received: ${JSON.stringify(data)}`);

  // --- Cek status transaksi ---
  let notifMessage = "";
  if (status === "success") {
    notifMessage = `✅ *Topup QRIS Sukses*\n\n🧍User: ${userqris}\n💰Nominal: Rp${amount.toLocaleString()}\n🆔Trx ID: ${trxid}\n🕒Waktu: ${created_at}\n🔖Ref: ${custom_ref}`;
    writeLog(`SUCCESS: Deposit completed for ${userqris} | Amount: ${amount}`);
  } else {
    notifMessage = `⚠️ *Topup QRIS Gagal/Pending*\n\n🧍User: ${userqris}\n💰Nominal: Rp${amount.toLocaleString()}\n🆔Trx ID: ${trxid}\n🕒Waktu: ${created_at}\n📍Status: ${status}`;
    writeLog(`FAILED: Payment ${status} for trx ${trxid}`);
  }

  // --- Kirim notifikasi ke Telegram ---
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: notifMessage,
      parse_mode: "Markdown",
    });
    writeLog("Telegram notification sent successfully.");
  } catch (err) {
    writeLog(`Failed to send Telegram notification: ${err.message}`);
  }

  // --- Respon ke server QRIS ---
  return res.json({ success: true, message: "Callback processed successfully" });
});

// === Jalankan server ===
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Callback server running on port ${PORT}`);
});
