import fs from "node:fs/promises";
import type { FileLoc, LocReport, SkippedFile } from "../types/index.js";

/**
 * Counts physical lines and source (non-empty) lines in a single file string.
 */

export function countLinesInContent(content: string): { total: number; source: number } {
    if (content.length === 0) {
        return { total: 0, source: 0 }
    }
    const rawLines = content.split('\n');
    const lines = rawLines.length > 1 && rawLines[rawLines.length - 1] === ""
        ? rawLines.slice(0, -1)
        : rawLines;
    let source = 0;

    for (const line of lines) {
        if (line.trim().length > 0) {
            source++;
        }
    }
    return {
        total: lines.length,
        source
    }
}

/**
 * Counts LOC across a list of file paths.
 * Reads files sequentially to ensure low memory footprint and prevent EMFILE errors.
 */

export async function countLoc(filePaths: string[]): Promise<LocReport> {
    const fileReports: FileLoc[] = [];
    let totalPhysicalLines = 0;
    let totalSourceLines = 0;
    const skipped: SkippedFile[] = [];

    for (const filePath of filePaths) {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            const { total, source } = countLinesInContent(content);

            totalPhysicalLines += total;
            totalSourceLines += source;

            fileReports.push({
                filePath,
                totalLines: total,
                sourceLines: source,
            });
        } catch (error: any) {
            // If a file was deleted or unreadable during scanning, skip gracefully
            skipped.push({
                filePath,
                code: error?.code,
                message: error?.message ?? "Read error",
            });
        }
    }
    return {
        totalPhysicalLines,
        totalSourceLines,
        totalFiles: fileReports.length,
        files: fileReports,
        skipped
    };
}