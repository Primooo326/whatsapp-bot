export const config = {
    port: process.env.PORT || 3100,
    sessionId: process.env.WHATSAPP_SESSION_ID || 'FC9CECEF-93B9-EF11-88D0-6045BD7990E1',
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb+srv...',
        dbName: 'wha_metrics'
    },
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
} as const;
