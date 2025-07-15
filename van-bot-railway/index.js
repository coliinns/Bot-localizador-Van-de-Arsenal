import express from "express";
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import FormData from "form-data";

const app = express();
const PORT = 8080;
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1393687088591015936/LrVYL5kN8K1XXwORlXvRCchyfdMdzGTMc1F_GMbDAEkF6-YIfFu9t8TsDEvcxLdNWhND";

async function captureVanImage() {
  console.log("🛰️ Abrindo GTA Lens (Van de Arsenal)...");

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );

    console.log("⏳ Navegando para o site...");
    await page.goto("https://gtalens.com/map/gun-vans", {
      waitUntil: "load",
      timeout: 60000,
    });

    console.log("📸 Tirando screenshot da página...");
    await page.screenshot({ path: "page.png", fullPage: true });
    console.log("✅ Screenshot tirado");

    console.log("⏳ Esperando o canvas aparecer...");
    await page.waitForSelector("canvas", { timeout: 60000 });
    console.log("✅ Canvas encontrado");

    const canvas = await page.$("canvas");
    if (!canvas) throw new Error("Canvas não encontrado");

    console.log("📸 Capturando a imagem do canvas...");
    const screenshot = await canvas.screenshot();

    console.log("📤 Enviando imagem para o Discord...");
    const form = new FormData();
    form.append("file", screenshot, {
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
      console.error("❌ Falha ao enviar imagem ao Discord:", await response.text());
    }

  } catch (error) {
    console.error("❗ Erro durante captura:", error);
  } finally {
    await browser.close();
    console.log("🛑 Browser fechado");
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
}, 30 * 60 * 1000);
