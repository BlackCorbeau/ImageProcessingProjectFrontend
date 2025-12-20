FROM node:20-alpine AS builder

WORKDIR /build
COPY . .
RUN npm install && \
    npm cache clean --force


FROM node:20-alpine

WORKDIR /app

COPY --from=builder . .

CMD ["npm", "run", "dev"]
