export function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`The variable ${name} was not defined in the .env file.`);
    return value;
}

