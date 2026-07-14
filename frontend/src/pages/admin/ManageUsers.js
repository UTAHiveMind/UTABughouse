import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import AdminSidebar from '../../components/Sidebar/AdminSidebar';
import ViewProfile from './ViewProfile';
import styles from '../../styles/ManageUsers.module.css';
import { useSidebar } from "../../components/Sidebar/SidebarContext";

import useIsMobile from '../../hooks/useIsMobile';
import { FaUser, FaUserGraduate, FaGraduationCap, FaShieldAlt } from "react-icons/fa";


// Get configuration from environment variables
const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';

// Construct the backend URL dynamically
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const { isCollapsed } = useSidebar();
    const sidebarWidth = isCollapsed ? "80px" : "270px";
    const isMobile = useIsMobile();

    const navigate = useNavigate();  // Initialize navigate using useNavigate
    
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                //Always show the Admin on the top, then Manager and Student
                const response = await axios.get(`${BACKEND_URL}/api/users`);
                const rolePriority = {
                    Admin: 0,
                    Manager: 1,
                    User: 2
                };
                const filteredUsers = response.data
                    .filter(user => selectedRole === "All" ? true : user.role === selectedRole)
                    .sort((a, b) => {
                        if (rolePriority[a.role] !== rolePriority[b.role]) {
                            return rolePriority[a.role] - rolePriority[b.role];
                        }
                        return a.lastName.localeCompare(b.lastName);
                    });
                setUsers(filteredUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [selectedRole]);

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <AdminSidebar selected="manage-users"/>

            {/* Main Content */}
                <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
                    <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
                    <h1 className={styles.heading}>Manage Users</h1>
                </div>


                {/* Table Container for Independent Scrolling */}
                <div className={styles.tableContainer}>
                    <div className={styles.toolbar}>
                        <input
                            type="text"
                            placeholder="Search by name or email"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchBar}
                        />
                        <div className={styles.roleSelector}>
                            <label htmlFor="role">Select Role:</label>
                            <select id="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                <option value="All">All Users</option>
                                <option value="Tutor">Tutors</option>
                                <option value="Student">Students</option>
                                <option value="Admin">Admins</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.spinnerContainer}>
                            <div className={styles.spinner}></div>
                            <p>Loading users...</p>
                        </div>
                    ) : users.length > 0 ? (
                        <table className={styles.userTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    {/* Mobile View */}
                                    {!isMobile && <th>Email</th>}   
                                    {!isMobile && <th>Phone</th>}
                                    {/* Mobile View */}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.firstName} {user.lastName}</td>
                                        <td className={styles.roleCell}>{user.role === 'Student' ? (<FaUser className={styles.studentRoleIcon} />) : 
                                        user.role === 'Tutor' ? (<FaGraduationCap className={styles.tutorRoleIcon} />) : 
                                        user.role === 'Admin' ? (<FaShieldAlt className={styles.adminRoleIcon} />) : null}
                                        {user.role}
                                        </td>
                                        {/* Mobile View */}
                                        {!isMobile && <td>{user.email}</td>}
                                        {!isMobile && <td>{user.phone}</td>}
                                        {/* Mobile View */}
                                        <td>
                                            <button 
                                                className={styles.viewProfileButton} 
                                                onClick={() => navigate(`/ViewProfile/${user._id}`)}
                                            >
                                                View Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No users found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ManageUsers;
