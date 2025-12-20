FROM node:20-alpine AS builder

WORKDIR /build

# Копируем только package.json для оптимизации кэширования
COPY package*.json ./
RUN npm install && \
    npm cache clean --force

# Копируем остальной код
COPY . .

FROM node:20-alpine

WORKDIR /app

# Копируем только нужные файлы из builder
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build ./

# Команда запуска
CMD ["npm", "run", "dev"]
