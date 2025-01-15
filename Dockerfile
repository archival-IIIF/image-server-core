FROM node:22-alpine AS builder

# Install global NPM tooling
RUN npm install typescript -g

# Copy the application
RUN mkdir -p /opt/iiif-image
COPY . /opt/iiif-image
WORKDIR /opt/iiif-image

# Install the application
RUN npm install --omit=dev

# Transpile the application
RUN npm run build

# Create the actual image
FROM node:22-alpine

# Copy application build from builder
COPY --from=builder /opt/ /opt/
WORKDIR /opt/iiif-image

# Run the application
ENTRYPOINT ["node", "dist/web.js"]
