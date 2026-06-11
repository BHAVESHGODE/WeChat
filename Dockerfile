# Stage 1: build the React client and install Node dependencies
FROM node:20-bullseye AS builder

WORKDIR /app

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/

RUN npm install -g npm@11.16.0
RUN npm ci --prefix client
RUN npm ci --prefix server

COPY client ./client
COPY server ./server

WORKDIR /app/client
RUN npm run build

# Stage 2: runtime image with Node and Python
FROM node:20-bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/server ./server
COPY --from=builder /app/client/build ./client/build
COPY start.sh ./start.sh

WORKDIR /app/server
RUN python3 -m pip install --no-cache-dir -r gaana_api/requirements.txt

RUN chmod +x /app/start.sh

ENV NODE_ENV=production
ENV PORT=5000
ENV GAANA_FLASK_PORT=5001

EXPOSE 5000

ENTRYPOINT ["/app/start.sh"]
