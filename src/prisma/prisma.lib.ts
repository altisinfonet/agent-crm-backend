import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  envFile: '.env',
})

export default prisma
