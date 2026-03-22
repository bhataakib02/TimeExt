import axios from "axios";
import { API_URL } from "@/context/AuthContext";

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
});

export const trackingService = {
    async getMetrics(range = "today") {
        const response = await axios.get(`${API_URL}/tracking?range=${range}`, { headers: getHeaders() });
        return response.data;
    },

    async getSummary() {
        const response = await axios.get(`${API_URL}/tracking/stats`, { headers: getHeaders() });
        return response.data;
    },

    async getScore(range = "today") {
        const response = await axios.get(`${API_URL}/tracking/score?range=${range}`, { headers: getHeaders() });
        return response.data;
    },

    async getHourlyMetrics(range = "today") {
        const response = await axios.get(`${API_URL}/tracking/hourly?range=${range}`, { headers: getHeaders() });
        return response.data;
    },

    async getCognitiveLoad() {
        const response = await axios.get(`${API_URL}/tracking/cognitive-load`, { headers: getHeaders() });
        return response.data;
    },

    async getDeepWorkHistory() {
        const response = await axios.get(`${API_URL}/deepwork/`, { headers: getHeaders() });
        return response.data;
    }
};
