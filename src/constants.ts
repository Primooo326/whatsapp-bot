// export const API_OLLAMA = 'http://192.99.246.129:11434/api'
export const API_BACK = process.env.API_BACK || 'http://localhost:8787/api/bot';
export const API_OLLAMA = process.env.API_OLLAMA || 'http://localhost:11434/api';
export const JWT_SECRET = process.env.JWT_SECRET || 'secret';