export const Logger = {
    info: (message: string) => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        console.log(`\x1b[90m[${time}]\x1b[0m \x1b[1;36mℹ\ufe0e SYSTEM\x1b[0m \x1b[90m›\x1b[0m \x1b[3m${message}\x1b[0m`);
    },
    success: (message: string) => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        console.log(`\x1b[90m[${time}]\x1b[0m \x1b[1;32m✔ ONLINE\x1b[0m \x1b[90m›\x1b[0m \x1b[3m${message}\x1b[0m`);
    },
    warn: (message: string) => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        console.warn(`\x1b[90m[${time}]\x1b[0m \x1b[1;33m⚠\ufe0e NOTICE\x1b[0m \x1b[90m›\x1b[0m \x1b[3m${message}\x1b[0m`);
    },
    error: (message: string, error?: unknown) => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        console.error(`\x1b[90m[${time}]\x1b[0m \x1b[1;31m✖ FAILED\x1b[0m \x1b[90m›\x1b[0m \x1b[3m${message}\x1b[0m`);
        
        if (error) {
            let errorStr = "";
            if (error instanceof Error) {
                errorStr = error.stack || error.message;
            } else if (typeof error === "object") {
                try {
                    errorStr = JSON.stringify(error, null, 2);
                } catch {
                    errorStr = String(error);
                }
            } else {
                errorStr = String(error);
            }
            
            const lines = errorStr.split("\n");
            for (const line of lines) {
                console.error(`\x1b[90m           \x1b[31m│\x1b[0m \x1b[90m${line}\x1b[0m`);
            }
        }
    }
};
