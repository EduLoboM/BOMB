/**
 * Retrieves a required environment variable or throws with a clear message.
 * Shared across index.ts and deployCommands.ts to avoid duplication.
 */
export function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`The variable ${name} was not defined in the .env file.`);
    }

    return value;
}
