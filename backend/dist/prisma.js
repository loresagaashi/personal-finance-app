"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Use require() and `any` to avoid editor/tsserver issues when @prisma/client types
// are not immediately available to the language server. Runtime still uses the
// generated Prisma Client from node_modules after `prisma generate`.
const PrismaPkg = require('@prisma/client');
const PrismaClient = PrismaPkg.PrismaClient;
const prisma = new PrismaClient();
exports.default = prisma;
