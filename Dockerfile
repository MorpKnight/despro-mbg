FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build for web
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npx expo export -p web

# Install serve to serve the static files
RUN npm install -g serve

# Expose port (default for serve is 3000, but we can configure it)
EXPOSE 8080

# Serve the 'dist' folder on port 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
