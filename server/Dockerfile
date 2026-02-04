FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Expose the port the app runs on
EXPOSE 5000

CMD ["npm", "start"]
