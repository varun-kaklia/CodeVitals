import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_EXTENSIONS } from "../config/defaults.js";

export interface WalkOptions {
    ignore?: string[];
    extensions?: string[];
}

/**
 * Memory-efficient recursive directory walker.
 * Uses Dirent to avoid extra stat calls, and prunes ignored directories early.
 *
 * @param dir - Absolute path of directory to walk
 * @param options - Ignore patterns and target file extensions
 * @returns Array of absolute file paths matching target extensions
 */

export async function walkDirectory(
    dir: string,
    options: WalkOptions = {}
): Promise<string[]> {
    const ignoreList = new Set(options.ignore ?? []);
    const extensions = new Set(options.extensions ?? DEFAULT_EXTENSIONS);
    const result: string[] = [];

    async function walk(currentDir: string): Promise<void> {
        let entries;
        try {
            entries = await fs.readdir(currentDir, { withFileTypes: true });
            entries.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error: any) {
            // Gracefully handle permission denied (EACCES) or missing directories
            if (error?.code === "EACCES" || error?.code === "EPERM") {
                return;
            }
            throw error;
        }
        for (const entry of entries) {
            if (ignoreList.has(entry.name)) {
                continue;
            }
            const fullPath = path.join(currentDir, entry.name)
            if (entry.isDirectory()) {
                // Recurse into subdirectories
                await walk(fullPath)
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (extensions.has(ext)) {
                    result.push(fullPath)
                }
            }
        }
    }
    await walk(dir);
    return result;
}