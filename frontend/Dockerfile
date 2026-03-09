FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build web version
RUN npx expo export -p web

# Install serve globally
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start server using PORT env variable (Railway sets this)
CMD serve dist -l ${PORT:-3000}
