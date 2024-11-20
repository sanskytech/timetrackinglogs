# Specify the base image
FROM node:19.5.0-alpine

# Set the working directory
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3040
CMD ["npm", "start"]


