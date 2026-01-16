// Use require() and `any` to avoid editor/tsserver issues when @prisma/client types
// are not immediately available to the language server. Runtime still uses the
// generated Prisma Client from node_modules after `prisma generate`.
const PrismaPkg: any = require('@prisma/client');
const PrismaClient = PrismaPkg.PrismaClient as any;

const prisma = new PrismaClient();

export default prisma;
