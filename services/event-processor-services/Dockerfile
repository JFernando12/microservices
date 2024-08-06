# Use the official Node.js image from the Docker Hub
FROM node:22-alpine

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy the JavaScript file to the container
COPY src/ ./src/
COPY package*.json ./

# Copiar el archivo .env
COPY .env ./

# Install the dependencies
RUN npm install

# Run the JavaScript file
CMD ["npm", "start"]
