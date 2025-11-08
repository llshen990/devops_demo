# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js .

# Set environment variables
ENV PORT=3001
ENV NODE_ENV=production

# Expose the port
EXPOSE 3001

# Start the application
CMD ["node", "server.js"] 