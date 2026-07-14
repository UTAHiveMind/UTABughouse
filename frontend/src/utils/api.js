import axios from 'axios';

// Function to send POST requests
export const axiosPostData = async (url, data) => {
    try {
        console.log(`Making POST request to: ${url}`, data);
        const response = await axios.post(url, data, { withCredentials: true });
        console.log(`Response received:`, response);
        return response;
    } catch (error) {
        console.error(`Error in POST request to ${url}:`, error);
        throw error;
    }
};

// Function to send GET requests
export const axiosGetData = async (url) => {
    try {
        console.log(`Making GET request to: ${url}`);
        const response = await axios.get(url, { withCredentials: true });
        console.log(`Response received:`, response);
        return response.data;
    } catch (error) {
        console.error(`Error in GET request to ${url}:`, error);
        throw error;
    }
};