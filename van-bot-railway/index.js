import puppeteer from "puppeteer";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot da Van rodando com Puppeteer!"));
app.listen(PORT, () => console.log(`Servidor web escutando na porta ${PORT}`));

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

(async () => {
  console.log("🛰️ Abrindo GTA Lens...");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://gtalens.com/map/gun-vans", {
    waitUntil: "networkidle2",
    timeout: 60000
  });

  await page.waitForSelector("canvas", { timeout: 15000 });
  const screenshotPath = "van.png";
  await page.screenshot({ path: screenshotPath });
  await browser.close();

  const form = new FormData();
  form.append("file", fs.createReadStream(screenshotPath));
  form.append("payload_json", JSON.stringify({
    username: "Van de Arsenal",
    content: "**Localização da Van de Arsenal no GTA Online**"
  }));

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    body: form
  });

  console.log("✅ Imagem enviada ao Discord!");
})();