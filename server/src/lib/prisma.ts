// ONE PrismaClient for the whole server — every router imports this instance.
// (Each PrismaClient owns a DB connection pool; never create one per file.)
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Prisma 7 is "Rust-free": the client compiles queries itself and needs a
// driver adapter to actually talk to Postgres.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })
