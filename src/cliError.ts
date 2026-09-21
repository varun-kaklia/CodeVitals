import { CodeVitalError } from "./core/errors.js";

export function handleCliError(error: unknown): never {
    if (error instanceof CodeVitalError) {
        console.error(`[CodeVitals] ${error.message}`)
        process.exit(error.exitCode)
    }
    const err = error as any;
    if (err?.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
        console.error(`[CodeVitals] ${err.message}`);
        console.error(`Run 'codevitals --help' to see valid options.`);
        process.exit(1);
    }
    if (err?.code === "ENOENT") {
        console.error(`[CodeVitals] Target directory not found: ${err.path ?? ""}`);
        process.exit(1);
    }
    // Fallback for completely unexpected crashes
    console.error(`[CodeVitals] Unexpected error: ${err?.message ?? error}`);
    process.exit(1);
}