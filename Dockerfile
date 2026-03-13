# Build stage
FROM node:lts-trixie-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npx nest build

# Production stage
FROM node:lts-trixie-slim AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 6969
CMD ["node", "dist/main.js"]







###############################

# # Build stage
# FROM node:22.22.1-alpine AS builder

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# COPY . .

# RUN npm run build


# # Production stage
# FROM node:22.22.1-alpine

# WORKDIR /app

# COPY package*.json ./

# RUN npm install --omit=dev

# COPY --from=builder /app/dist ./dist

# EXPOSE 6969

# CMD ["node", "dist/main.js"]

###############################################################

# FROM node:22.22.1-alpine

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# COPY . .

# RUN npm run build

# EXPOSE 6969

# CMD ["node", "dist/main.js"]


