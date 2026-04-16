FROM node:24-alpine

# Init the work dir
RUN mkdir -p /opt/iiif-image
WORKDIR /opt/iiif-image

# Install the application
COPY package.json /opt/iiif-image
COPY package-lock.json /opt/iiif-image
RUN npm install --omit=dev

# Copy the application
COPY src /opt/iiif-image/src

# Run the application
ENTRYPOINT ["node", "src/web.ts"]
