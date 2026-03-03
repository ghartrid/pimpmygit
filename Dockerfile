FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "8000"]
