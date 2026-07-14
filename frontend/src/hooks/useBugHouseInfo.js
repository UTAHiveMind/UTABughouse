import { useState, useEffect } from "react";
import axios from "axios";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function useBugHouseInfo() {
  const [bugHouseInfo, setBugHouseInfo] = useState({
    logo: "",
    contactInfo: {
      email: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    const fetchBugHouseInfo = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/bughouse`);
        setBugHouseInfo(
          response.data || {
            logo: "",
            contactInfo: {
              email: "",
              phone: "",
              address: "",
            },
          }
        );
      } catch (error) {
        console.error("Error fetching bugHouse info:", error);
      }
    };

    fetchBugHouseInfo();
  }, []);

  return bugHouseInfo;
}

export default useBugHouseInfo;