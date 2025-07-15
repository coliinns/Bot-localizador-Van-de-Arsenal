FROM node:18-bullseye-slim

# Instala dependências necessárias para Chromium funcionar
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Define diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json para cache de npm install
COPY package*.json ./

# Instala as dependências (incluindo puppeteer)
RUN npm install

# Copia o resto do código
COPY . .

# Variável para Chromium rodar sem sandbox (necessário em vários servidores)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

# Comando padrão para rodar seu script
CMD ["node", "index.js"]
