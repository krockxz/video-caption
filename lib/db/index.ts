import { PrismaClient } from '@prisma/client'
import { accessSync, chmodSync, constants as fsConstants } from 'fs'
import { resolve } from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * When using SQLite, Prisma expects the underlying database file to be writable.
 * On some systems (especially when the repo has been copied or restored), the
 * file permissions can accidentally drop the write bit which triggers the
 * "attempt to write a readonly database" error. Before creating the Prisma
 * client we detect the SQLite file path and ensure it is writable.
 */
function ensureSqliteDatabaseWriteable() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl || !databaseUrl.startsWith('file:')) {
    return
  }

  const relativePath = databaseUrl.replace('file:', '').replace(/^\/\//, '')

  // If the env already points to an absolute path, use it as-is.
  const candidatePaths = new Set<string>()
  if (relativePath.startsWith('/')) {
    candidatePaths.add(relativePath)
  } else {
    // Resolve relative to the project root
    candidatePaths.add(resolve(process.cwd(), relativePath))

    // Also resolve relative to the prisma directory since Prisma CLI uses that base
    candidatePaths.add(resolve(process.cwd(), 'prisma', relativePath.replace(/^\.\//, '')))
  }

  for (const candidatePath of candidatePaths) {
    try {
      accessSync(candidatePath)
    } catch {
      continue
    }

    try {
      accessSync(candidatePath, fsConstants.W_OK)
      return
    } catch {
      try {
        chmodSync(candidatePath, 0o660)
        return
      } catch {
        // ignore and try next candidate
      }
    }
  }
}

// Ensure SQLite database file is writable before instantiating Prisma.
try {
  ensureSqliteDatabaseWriteable()
} catch (error) {
  console.warn('Warning: Unable to verify SQLite database permissions:', error)
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma