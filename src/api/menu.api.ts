import axios from 'axios';
import { API_BACK } from '../constants';

export const getMenu = async (categoria?: string) => {

    try {

        const response = await axios.get(`${API_BACK}/menu?categoria=${categoria}`);

        return response.data;
    }
    catch (error) {
        console.log(error);
    }

}