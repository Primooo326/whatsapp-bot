import axios from 'axios';
import { API_BACK } from '../constants';
export const getUser = async (phone: string) => {

    try {
        const response = await axios.get(`${API_BACK}/users/${phone}`);
        return response.data;
    } catch (error: any) {
        return error.data;
    }

}