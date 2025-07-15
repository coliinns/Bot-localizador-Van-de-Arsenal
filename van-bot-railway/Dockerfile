# Imagem base com Node e suporte ao Chromium
FROM node:18-bullseye

# Instalar dependências do sistema para o Chromium
RUN apt-get update && apt-get install -y \
    gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 \
    libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
    libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libnss3 \
    lsb-release xdg-utils wget libdrm2 libgbm1 \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências Node.js
RUN npm install

# Copiar todos os arquivos
COPY . .

# Expor porta do servidor
EXPOSE 8080

# Comando para iniciar o bot
CMD ["node", "index.js"]
