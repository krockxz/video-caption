import { promises as fs } from 'fs'
import { join } from 'path'

/**
 * File system utility functions for safe file and folder operations
 */

/**
 * Recursively delete a directory and all its contents
 * @param dirPath - Path to the directory to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteDirectory(dirPath: string): Promise<void> {
  try {
    // Check if directory exists
    await fs.access(dirPath)

    // Read directory contents
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    // Delete all entries recursively
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dirPath, entry.name)

        if (entry.isDirectory()) {
          // Recursively delete subdirectory
          await deleteDirectory(fullPath)
        } else {
          // Delete file
          await fs.unlink(fullPath)
        }
      })
    )

    // Delete the directory itself
    await fs.rmdir(dirPath)

  } catch (error: any) {
    // If directory doesn't exist, that's fine
    if (error.code === 'ENOENT') {
      return
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Delete a single file safely
 * @param filePath - Path to the file to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.access(filePath)
    await fs.unlink(filePath)
  } catch (error: any) {
    // If file doesn't exist, that's fine
    if (error.code === 'ENOENT') {
      return
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Check if a file or directory exists
 * @param path - Path to check
 * @returns True if exists, false otherwise
 */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Get the size of a file in bytes
 * @param filePath - Path to the file
 * @returns File size in bytes, or 0 if file doesn't exist
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath)
    return stats.size
  } catch {
    return 0
  }
}

/**
 * Create a directory if it doesn't exist
 * @param dirPath - Path to the directory to create
 * @returns Promise that resolves when directory is created
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error: any) {
    // If directory already exists, that's fine
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
}

/**
 * Safe file deletion with validation
 * @param filePath - Path to the file to delete
 * @param allowedBasePath - Base path that the file must be within (for security)
 * @returns Promise that resolves when deletion is complete
 */
export async function safeDeleteFile(
  filePath: string,
  allowedBasePath: string
): Promise<void> {
  // Resolve to absolute paths
  const absoluteFilePath = filePath.startsWith('/')
    ? filePath
    : join(process.cwd(), filePath)
  const absoluteBasePath = allowedBasePath.startsWith('/')
    ? allowedBasePath
    : join(process.cwd(), allowedBasePath)

  // Security check: ensure file is within allowed base path
  if (!absoluteFilePath.startsWith(absoluteBasePath)) {
    throw new Error('Security violation: File path is outside allowed directory')
  }

  // Additional safety: ensure we're not trying to delete critical directories
  const criticalPaths = [
    join(process.cwd(), 'app'),
    join(process.cwd(), 'lib'),
    join(process.cwd(), 'node_modules'),
    join(process.cwd(), 'prisma'),
  ]

  for (const criticalPath of criticalPaths) {
    if (absoluteFilePath.startsWith(criticalPath)) {
      throw new Error('Security violation: Attempting to delete critical system file')
    }
  }

  await deleteFile(absoluteFilePath)
}

/**
 * Safe directory deletion with validation
 * @param dirPath - Path to the directory to delete
 * @param allowedBasePath - Base path that the directory must be within (for security)
 * @returns Promise that resolves when deletion is complete
 */
export async function safeDeleteDirectory(
  dirPath: string,
  allowedBasePath: string
): Promise<void> {
  // Resolve to absolute paths
  const absoluteDirPath = dirPath.startsWith('/')
    ? dirPath
    : join(process.cwd(), dirPath)
  const absoluteBasePath = allowedBasePath.startsWith('/')
    ? allowedBasePath
    : join(process.cwd(), allowedBasePath)

  // Security check: ensure directory is within allowed base path
  if (!absoluteDirPath.startsWith(absoluteBasePath)) {
    throw new Error('Security violation: Directory path is outside allowed directory')
  }

  // Additional safety: ensure we're not trying to delete critical directories
  const criticalPaths = [
    join(process.cwd(), 'app'),
    join(process.cwd(), 'lib'),
    join(process.cwd(), 'node_modules'),
    join(process.cwd(), 'prisma'),
    join(process.cwd(), 'public'), // Don't allow deletion of entire public folder
  ]

  for (const criticalPath of criticalPaths) {
    if (absoluteDirPath === criticalPath) {
      throw new Error('Security violation: Attempting to delete critical system directory')
    }
  }

  await deleteDirectory(absoluteDirPath)
}