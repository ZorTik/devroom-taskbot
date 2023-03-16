FROM node:16
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
CMD [ "npx", "ts-node", "--esm", "index.ts" ]
