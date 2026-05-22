import 'dotenv/config';

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
    port: process.env.PORT || 3100,
    sessionId: process.env.WHATSAPP_SESSION_ID || 'default-session',
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wha_metrics'
    },
    queue: {
        delayMs: parsePositiveInt(process.env.MESSAGE_QUEUE_DELAY_MS, 1000),
        maxSize: parsePositiveInt(process.env.MESSAGE_QUEUE_MAX_SIZE, 500),
    },
    send: {
        retryBaseDelayMs: parsePositiveInt(process.env.WHATSAPP_RETRY_BASE_DELAY_MS, 3000),
    },
    downloads: {
        timeoutMs: parsePositiveInt(process.env.WHATSAPP_DOWNLOAD_TIMEOUT_MS, 20000),
    },
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
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
            '--js-flags=--max-old-space-size=512'
        ]
    }
} as const;
