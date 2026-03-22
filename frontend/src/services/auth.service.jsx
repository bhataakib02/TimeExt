import axios from "axios";
import { API_URL } from "@/context/AuthContext";

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
});

export const authService = {
    async updateProfile(profileData) {
        const response = await axios.put(`${API_URL}/auth/profile`, profileData, { headers: getHeaders() });
        return response.data;
    },

    async updateConfig(configData) {
        const response = await axios.put(`${API_URL}/auth/preferences`, configData, { headers: getHeaders() });
        return response.data;
    },

    async deleteAccount() {
        const response = await axios.delete(`${API_URL}/auth/account`, { headers: getHeaders() });
        return response.data;
    }
};
