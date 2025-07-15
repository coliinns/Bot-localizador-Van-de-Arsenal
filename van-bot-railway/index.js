const puppeteer = require("puppeteer");
const fs = require("fs");
const FormData = require("form-data");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1393687088591015936/LrVYL5kN8K1XXwORlXvRCchyfdMdzGTMc1F_GMbDAEkF6-YIfFu9t8TsDEvcxLdNWhND";

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capturarImagemVan() {
  console.log("🛰️ Abrindo site GTA Lens (Van de Arsenal)...");

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/chromium", // 🚀 compatível com Railway (Nixpacks)
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 720 }
  });

  const page = await browser.newPage();
  await page.goto("https://gtalens.com/map/gun-vans", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  await esperar(5000);

  try {
    await page.evaluate(() => {
      const lista = document.querySelectorAll(".van-list-item");
      if (lista.length > 0) lista[0].click();
    });
    console.log("✅ Primeira Van selecionada.");
  } catch {
    console.log("⚠️ Não foi possível clicar na Van.");
  }

  await esperar(3000);

  await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const satBtn = spans.find(span => span.textContent.trim().toLowerCase() === "satellite");
    if (satBtn) satBtn.click();
  });
  await esperar(2000);

  await page.evaluate(() => {
    const fullscreenBtn = document.querySelector("a.leaflet-control-fullscreen-button");
    if (fullscreenBtn) fullscreenBtn.click();
  });
  await esperar(2000);

  const zoomIn = await page.$("span.leaflet-control-zoom-in");
  if (zoomIn) await zoomIn.click();
  await esperar(1000);

  const zoomOut = await page.$("a.leaflet-control-zoom-out");
  if (zoomOut) {
    for (let i = 0; i < 3; i++) {
      await zoomOut.click();
      await esperar(1000);
    }
  }

  const resultado = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll("div.leaflet-marker-icon"));
    const vanDiv = divs.find(div => div.innerHTML.includes("svg") && div.innerHTML.includes("viewBox=\"0 0 64 64\""));
    if (!vanDiv) return null;

    vanDiv.style.transform += " scale(1.3)";
    vanDiv.style.zIndex = "9999";

    const rect = vanDiv.getBoundingClientRect();
    window.scrollBy({
      top: rect.top - window.innerHeight / 2 + rect.height / 2,
      left: rect.left - window.innerWidth / 2 + rect.width / 2,
      behavior: 'instant'
    });

    return { x: Math.round(rect.left), y: Math.round(rect.top) };
  });

  if (!resultado) {
    console.log("❌ Nenhuma Van encontrada.");
    await browser.close();
    return { screenshotPath: null };
  }

  const screenshotPath = "van_lens.png";
  await esperar(1500);
  await page.screenshot({ path: screenshotPath });
  await browser.close();

  console.log("📍 Coordenadas da Van (para debug):", resultado.x, resultado.y);
  return { screenshotPath };
}

async function enviarParaDiscord(caminhoImagem) {
  console.log("📤 Enviando imagem da Van para o Discord...");

  const form = new FormData();
  form.append("file", fs.createReadStream(caminhoImagem));

  const embed = {
    embeds: [
      {
        color: 0x71675a,
        image: { url: "attachment://van_lens.png" },
        footer: {
          text: "GTA Bot localizador - https://discord.gg/MxChf89Yqx",
        },
      },
    ],
  };

  form.append("payload_json", JSON.stringify(embed));

  const resposta = await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  if (resposta.ok) {
    console.log("✅ Embed enviado com sucesso!");
  } else {
    console.error("❌ Erro ao enviar:", await resposta.text());
  }
}

async function main() {
  const { screenshotPath } = await capturarImagemVan();
  if (screenshotPath) {
    await enviarParaDiscord(screenshotPath);
  } else {
    console.log("⚠️ Não foi possível capturar a imagem.");
  }
}

main();
