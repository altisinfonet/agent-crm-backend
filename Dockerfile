FROM node:22.22.1-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 6969

CMD ["node", "dist/main.js"]