import axios from 'axios';
import { API_OLLAMA } from '../constants';

export const getModels = async () => {

    try {
        const response = await axios.get(`${API_OLLAMA}/tags`);
        return response.data;
    } catch (error: any) {
        return error.data;
    }
}

export const romeo = async (): Promise<string> => {

    try {
        const response = await axios.post(`${API_OLLAMA}/generate`, {
            "model": "romeo",
            "prompt": "Dame un pequeño poema, no utilices emogis",
            "stream": false
        });

        return response.data.response;
    } catch (error: any) {
        return "Hubo un error al generar el poema";
    }
}
