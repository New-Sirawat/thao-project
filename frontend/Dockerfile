FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install npm packages
RUN npm install

# Copy application files
COPY . .

ENV CI=true
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV PORT=8081

EXPOSE 8081

# Start Expo in Web mode on port 8081
CMD ["npx", "expo", "start", "--web", "--port", "8081", "--host", "lan"]
