export const Logger = {
    log: (message: string, ...args: any[]) => {
        console.log(`%c[GTT Pro] ${message}`, 'color: #ffff00; font-weight: bold;', ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.error(`%c[GTT Pro] ${message}`, 'color: #ff0000; font-weight: bold;', ...args);
    },
    success: (message: string, ...args: any[]) => {
        console.log(`%c[GTT Pro] ✅ ${message}`, 'color: #00ff00; font-weight: bold;', ...args);
    }
};
