FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

# Create data dir for persistent signatures
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]
