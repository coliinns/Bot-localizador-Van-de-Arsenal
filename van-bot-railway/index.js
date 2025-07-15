import express from "express";
import puppeteer from "puppeteer";
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
    headless: false, // muda para true no deploy!
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
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

    // Tenta clicar em vários botões que podem bloquear o canvas
    const cookieSelectors = [
      "button#accept-cookies",
      "button.cookie-accept",
      "button#onetrust-accept-btn-handler",
      "button[aria-label='Accept cookies']",
    ];

    for (const sel of cookieSelectors) {
      try {
        await page.click(sel);
        console.log(`Cookie aceito via seletor: ${sel}`);
        break;
      } catch {}
    }

    // Screenshot para diagnosticar o que está carregado antes do canvas
    await page.screenshot({ path: "before_canvas.png" });
    console.log("Screenshot before_canvas.png salva");

    // Lista os frames para diagnóstico
    for (const frame of page.frames()) {
      console.log("Frame url:", frame.url());
    }

    // Aumenta timeout para 60s esperando canvas
    await page.waitForSelector("canvas", { timeout: 60000 });
    console.log("Canvas encontrado");

    const canvasElement = await page.$("canvas");
    if (!canvasElement) throw new Error("Canvas não encontrado após waitForSelector");

    const imageBuffer = await canvasElement.screenshot();

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

captureVanImage();

app.get("/", (req, res) => {
  res.send("Bot da Van rodando com Puppeteer!");
});

app.listen(PORT, () => {
  console.log(`Servidor web escutando na porta ${PORT}`);
});

setInterval(() => {
  captureVanImage();
}, 30 * 60 * 1000); // a cada 30 minutos
