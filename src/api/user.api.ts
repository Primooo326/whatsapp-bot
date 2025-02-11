import axios from 'axios';
import { API_URL } from '../constants';
export const getUser = async (phone: string) => {

    try {
        const response = await axios.get(`${API_URL}/users/${phone}`);
        return response.data;
    } catch (error: any) {
        return error.data;
    }

}