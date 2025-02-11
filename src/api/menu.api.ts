import axios from 'axios';
import { API_URL } from '../constants';

export const getMenu = async (categoria?: string) => {

    try {

        const response = await axios.get(`${API_URL}/menu?categoria=${categoria}`);

        return response.data;
    }
    catch (error) {
        console.log(error);
    }

}