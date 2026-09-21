export interface FileLoc {
  filePath: string;
  totalLines: number;
  sourceLines: number; // Non-empty lines
}

export interface SkippedFile {
  filePath: string;
  code?: string;
  message: string;
}

export interface LocReport {
  totalPhysicalLines: number;
  totalSourceLines: number;
  totalFiles: number;
  files: FileLoc[];
  skipped: SkippedFile[];
}