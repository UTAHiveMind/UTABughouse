import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/Sidebar/AdminSidebar";
import styles from "../../styles/TutorRequests.module.css";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function studentHeatMap()
{}
export default studentHeatMap;