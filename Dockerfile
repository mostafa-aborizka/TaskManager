FROM node:22-alpine

WORKDIR /app 

COPY package*.json ./

RUN npm ci --no-audit --no-fund

COPY . .

RUN npx prisma generate

EXPOSE 5003

CMD ["sh", "-c", "npx prisma migrate deploy && node ./src/server.js"]