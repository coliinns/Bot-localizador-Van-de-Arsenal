import express from "express";
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1393687088591015936/LrVYL5kN8K1XXwORlXvRCchyfdMdzGTMc1F_GMbDAEkF6-YIfFu9t8TsDEvcxLdNWhND";
const PORT = 8080;

async function captureVanImage() {
  console.log("🛰️ Abrindo GTA Lens (Van de Arsenal)...");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome", // Chromium do sistema (Render.com)
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-zygote",
      "--single-process",
      "--disable-gpu"
    ]
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );

    await page.goto("https://gtalens.com/map/gun-vans", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Aceitar cookies se aparecer
    try {
      await page.click("button#accept-cookies");
      console.log("Cookies aceitos");
    } catch {
      console.log("Botão de cookies não encontrado ou não necessário");
    }

    await page.waitForSelector("canvas", { timeout: 30000 });
    console.log("Canvas encontrado");

    const canvasElement = await page.$("canvas");
    if (!canvasElement) throw new Error("Canvas não encontrado");

    const imageBuffer = await canvasElement.screenshot();

    const form = new FormData();
    form.append("file", imageBuffer, {
      filename: "van.png",
      contentType: "image/png"
    });

    const response = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      body: form
    });

    if (response.ok) {
      console.log("✅ Imagem enviada ao Discord!");
    } else {
      console.error("❌ Erro ao enviar imagem ao Discord:", await response.text());
    }

    await browser.close();
  } catch (error) {
    console.error("Erro durante captura:", error);
    await browser.close();
  }
}

captureVanImage();

app.get("/", (req, res) => {
  res.send("Bot da Van rodando com Puppeteer!");
});

app.listen(PORT, () => {
  console.log(`Servidor web escutando na porta ${PORT}`);
});

// Agendamento a cada 30 minutos
setInterval(() => {
  captureVanImage();
}, 30 * 60 * 1000);
