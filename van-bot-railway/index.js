import express from "express";
import puppeteer from "puppeteer-core";
import chrome from "chrome-aws-lambda";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

async function captureVanImage() {
  console.log("🛰️ Abrindo GTA Lens (Van de Arsenal)...");

  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath: await chrome.executablePath,
    headless: chrome.headless,
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );

    await page.goto("https://gtalens.com/map/gun-vans", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Tenta clicar no botão de aceitar cookies se existir
    try {
      await page.click("button#accept-cookies");
      console.log("Cookies aceitos");
    } catch {
      console.log("Botão de cookies não encontrado ou não necessário");
    }

    // Espera pelo canvas com timeout maior
    await page.waitForSelector("canvas", { timeout: 30000 });
    console.log("Canvas encontrado");

    // Você pode ajustar o screenshot para capturar só a área desejada
    const canvasElement = await page.$("canvas");
    if (!canvasElement) throw new Error("Canvas não encontrado após waitForSelector");

    const imageBuffer = await canvasElement.screenshot();

    // Enviar imagem para o Discord via webhook
    const form = new FormData();
    form.append("file", imageBuffer, {
      filename: "van.png",
      contentType: "image/png",
    });

    const response = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      body: form,
    });

    if (response.ok) {
      console.log("✅ Imagem enviada ao Discord!");
    } else {
      console.error("❌ Falha ao enviar imagem ao Discord", await response.text());
    }

    await browser.close();
  } catch (error) {
    console.error("Erro durante captura:", error);
    await browser.close();
  }
}

// Executa a captura inicialmente
captureVanImage();

// Servidor Express para manter o bot rodando e responder em /
app.get("/", (req, res) => {
  res.send("Bot da Van rodando com Puppeteer!");
});

app.listen(PORT, () => {
  console.log(`Servidor web escutando na porta ${PORT}`);
});

// Opcional: captura a cada X minutos para atualizar info (exemplo a cada 30 minutos)
setInterval(() => {
  captureVanImage();
}, 30 * 60 * 1000); // 30 minutos
