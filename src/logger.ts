const log = (tag: string, msg: string, method: "log" | "warn" | "error" = "log") => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    console[method](`\x1b[90m[${time}]\x1b[0m ${tag} \x1b[90m›\x1b[0m \x1b[3m${msg}\x1b[0m`);
};

export const Logger = {
    info: (msg: string) => log("\x1b[1;36mℹ\ufe0e SYSTEM\x1b[0m", msg),
    success: (msg: string) => log("\x1b[1;32m✔ ONLINE\x1b[0m", msg),
    warn: (msg: string) => log("\x1b[1;33m⚠\ufe0e NOTICE\x1b[0m", msg, "warn"),
    error: (msg: string, error?: unknown) => {
        log("\x1b[1;31m✖ FAILED\x1b[0m", msg, "error");
        if (!error) return;
        const errStr = error instanceof Error ? (error.stack || error.message)
            : typeof error === "object" ? (() => { try { return JSON.stringify(error, null, 2); } catch { return String(error); } })()
            : String(error);
        errStr.split("\n").forEach(line => console.error(`\x1b[90m           \x1b[31m│\x1b[0m \x1b[90m${line}\x1b[0m`));
    }
};

