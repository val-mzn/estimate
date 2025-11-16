FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
COPY prisma.config.ts ./

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

