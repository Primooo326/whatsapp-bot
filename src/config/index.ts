import 'dotenv/config';

export const config = {
    port: process.env.PORT || 3100,
    sessionId: process.env.WHATSAPP_SESSION_ID || 'default-session',
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wha_metrics'
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
