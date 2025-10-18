FROM node:lts-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for Expo)
RUN npm install

# Copy project files
COPY . .

# Expose Expo ports
# 8081: Metro bundler
# 19000: Expo Dev Tools
# 19001: Expo Dev Tools (secure)
# 19002: Expo Dev Tools (ng serve)
EXPOSE 8081 19000 19001 19002

# Start Expo
CMD ["npx", "expo", "start", "--tunnel"]
