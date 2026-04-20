# Use Node.js 20 with Alpine Linux for smaller image size
FROM node:20-alpine

# Install necessary packages for Electron and GUI applications
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    xvfb \
    dbus \
    gtk+3.0 \
    libxss \
    gconf \
    alsa-lib \
    at-spi2-atk \
    libnss3 \
    libxcomposite \
    libxcursor \
    libxdamage \
    libxext \
    libxfixes \
    libxi \
    libxrandr \
    libxtst \
    cups-libs \
    mesa-dri-gallium

# Set Chromium path for Electron
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Create node-sass compatibility wrapper (from our previous fix)
RUN mkdir -p node_modules/node-sass/lib && \
    echo '{"name":"node-sass","version":"4.12.0","description":"Wrapper around libsass","main":"lib/index.js","license":"MIT"}' > node_modules/node-sass/package.json

COPY docker/node-sass-wrapper.js node_modules/node-sass/lib/index.js

# Set environment variables
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV SKIP_PREFLIGHT_CHECK=true
ENV PORT=9999
ENV DISPLAY=:99

# Expose port
EXPOSE 9999

# Create startup script that handles X11 forwarding for Electron
RUN echo '#!/bin/sh\n\
# Start Xvfb for headless display\n\
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &\n\
export DISPLAY=:99\n\
\n\
# Wait a moment for Xvfb to start\n\
sleep 2\n\
\n\
# Check if we should run in development or production mode\n\
if [ "$NODE_ENV" = "production" ]; then\n\
    yarn build\n\
else\n\
    yarn start\n\
fi' > /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Default command
CMD ["/app/docker-entrypoint.sh"]
