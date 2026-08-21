import { PrismaClient } from "../generated/client/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

// Bun auto-loads .env, so DATABASE_URL is available via process.env
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });
