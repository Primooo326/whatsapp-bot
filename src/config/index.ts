import 'dotenv/config';

export const config = {
    port: process.env.PORT || 3100,
    sessionId: process.env.WHATSAPP_SESSION_ID || 'default-session',
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wha_metrics'
    },
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            // '--single-process', // REMOVIDO: causa congelamiento de Chromium bajo carga
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-translate',
            '--disable-sync',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-default-browser-check',
            '--disable-hang-monitor',
            '--disable-prompt-on-repost',
            '--disable-client-side-phishing-detection',
            '--disable-component-update',
            '--disable-domain-reliability',
            '--disable-features=TranslateUI',
            '--js-flags=--max-old-space-size=512',
            '--disk-cache-size=1',
            '--media-cache-size=1'
        ]
    }
} as const;
