import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "../../styles/component/SideBar.module.css";
import { handleLogout } from "../../utils/authUtils";
import BaseSidebar from "./BaseSidebar";
import { useSidebar } from "./SidebarContext";
import {
  MdOutlineSpaceDashboard,
  MdOutlineAnalytics,
  MdOutlineEmail,
  MdLogout,
  MdRateReview,
} from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUsers } from "react-icons/fa6";
import { FaBookOpen } from "react-icons/fa";
import { FaInbox } from 'react-icons/fa';

//mobile view
import useBugHouseInfo from "../../hooks/useBugHouseInfo";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import useMobileDrawer from "../../hooks/useMobileDrawer";
import useSidebarNavigation from "../../hooks/useSidebarNavigation";
import MobileMenuTrigger from "./MobileMenuTrigger";
import MobileDrawer from "./MobileDrawer";
//mobile view


const AdminSidebar = ({ selected }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar } = useSidebar();

    //======== Mobile Navigation State ========
  const {isMobile, isMobileMenuOpen, setIsMobileMenuOpen} = useMobileDrawer();
  //Handles page navigation and automatically closes the mobile drawer right after navigation
  const goTo = useSidebarNavigation(location, navigate, isMobile, setIsMobileMenuOpen);
  const bugHouseInfo = useBugHouseInfo(); //Fetching BugHouse Info and contact Info by using custom hook

  const adminMenuItems = [
  {
    key: "admin-reviews",
    label: "Tutor Review",
    icon: MdRateReview,
    onClick: () => goTo("/admin-reviews"),
  },
  {
    key: "analytics",
    label: "System Analytics",
    icon: MdOutlineAnalytics,
    onClick: () => goTo("/analytics"),
  },
  {
    key: "admin-email",
    label: "Admin Email",
    icon: MdOutlineEmail,
    onClick: () => goTo("/admin/email"),
  },
];

  return (
        <>
    {/* ==================Mobile View ====================*/}
    <MobileMenuTrigger
      isMobile={isMobile}
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
    />
    <MobileDrawer
      isMobile={isMobile}
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
      bugHouseInfo={bugHouseInfo}
      handleLogout={handleLogout}
      menuItems={adminMenuItems}
    />
  {/* ==================Mobile View ====================*/}
    <div className={`${styles.sidebar} ${!isMobile && isCollapsed ? styles.sidebarActive : ""}`}>
      <BaseSidebar isCollapsed={!isMobile && isCollapsed}>
        <div
          className={`${styles.burgerContainer} ${isCollapsed ? styles.burgerContainerActive : ""}`}
        >
          <div className={styles.burgerTrigger} onClick={toggleSidebar} role="button" tabIndex={0} />
          <div className={styles.burgerMenu}></div>
        </div>
        <div className={`${styles.contentsContainer} ${!isMobile && isCollapsed ? styles.contentsContainerActive : ""}`}>
          <ul className={styles.ulStudent}>
            <li
            
              className={`${styles.liStudent} ${selected === "home" ? styles.active : ""}`} 
              onClick={() => goTo("/home")}
            >
              <div className={styles.iconContainer}>
                <MdOutlineSpaceDashboard className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Dashboard</span>
            </li>
            <li
              className={`${styles.liStudent} ${selected === "manage-users" ? styles.active : ""}`}
              onClick={() => goTo("/manage-users")}
            >
              <div className={styles.iconContainer}>
                <FaUsers className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Manage Users</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "manage-courses" ? styles.active : ""}`} 
              onClick={() => goTo("/manage-courses")}
            >
              <div className={styles.iconContainer}>
                <FaBookOpen className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Manage Courses</span>
            </li>

            <li
              className={`${styles.liStudent} ${selected === "admin-reviews" ? styles.active : ""}  ${styles.hiddenMobile}`}  //add hiddenMobile class for hiding item in mobile view
              onClick={() => goTo("/admin-reviews")}
            >
              <div className={styles.iconContainer}>
                <MdRateReview className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Tutor Review</span>
            </li>



            <li 
              className={`${styles.liStudent} ${selected === "analytics" ? styles.active : ""}  ${styles.hiddenMobile}`}  //add hiddenMobile class for hiding item in mobile view
              onClick={() => goTo("/analytics")}
            >
              <div className={styles.iconContainer}>
                <MdOutlineAnalytics className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>System Analytics</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "tutor-requests" ? styles.active : ""}`} 
              onClick={() => goTo("/tutor-requests")}
            >
              <div className={styles.iconContainer}>
                <FaInbox className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Tutor Requests</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "admin-settings" ? styles.active : ""}`} 
              onClick={() => goTo("/admin-settings")}
            >
              <div className={styles.iconContainer}>
                <IoSettingsOutline className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Settings</span>
            </li>
            {/* Admin Email link */}
           <li
             className={`${styles.liStudent} ${selected==="admin-email"?styles.active:""}  ${styles.hiddenMobile}`} //add hiddenMobile class for hiding item in mobile view
             onClick={() => goTo("/admin/email")}
           >
             <div className={styles.iconContainer}>
               <MdOutlineEmail className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem} style={{ marginLeft: '8px' }}>
                Admin Email
              </span>
            </li>

            <li 
            className={`${styles.liStudent} ${styles.hiddenMobile}`} //add hiddenMobile class for hiding item in mobile view
            onClick={handleLogout}>
              <div className={styles.iconContainer}>
                <MdLogout className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Log Out</span>
            </li>
          </ul>
        </div>
      </BaseSidebar>
    </div>
  </>
  );
};

export default AdminSidebar;
