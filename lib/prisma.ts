import { PrismaClient } from "@prisma/client";

// Create a singleton instance of Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient();
};

type prismaClientSingletonType = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
}; // to avoid multiple instances of Prisma Client in development

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
