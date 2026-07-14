import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../../styles/component/SideBar.module.css";
import { handleLogout } from "../../utils/authUtils";
import BaseSidebar from "./BaseSidebar";
import { useSidebar } from "./SidebarContext";
import { FaSearch } from "react-icons/fa";
import { AiOutlineSchedule } from "react-icons/ai";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { CgProfile } from "react-icons/cg";
import { FaRegAddressCard } from "react-icons/fa";
import {
  MdOutlineSpaceDashboard,
  MdOutlineFeedback,
  MdLogout,
  MdOutlineSchedule
} from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";
import { SlCalender } from "react-icons/sl";

//mobile view
import useBugHouseInfo from "../../hooks/useBugHouseInfo";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import useMobileDrawer from "../../hooks/useMobileDrawer";
import useSidebarNavigation from "../../hooks/useSidebarNavigation";
import MobileMenuTrigger from "./MobileMenuTrigger";
import MobileDrawer from "./MobileDrawer";
//mobile view

const TutorSidebar = ({ selected }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  //======== Mobile Navigation State ========
  const {isMobile, isMobileMenuOpen, setIsMobileMenuOpen} = useMobileDrawer();
  //Handles page navigation and automatically closes the mobile drawer right after navigation
  const goTo = useSidebarNavigation(location, navigate, isMobile, setIsMobileMenuOpen);
  const bugHouseInfo = useBugHouseInfo(); //Fetching BugHouse Info and contact Info by using custom hook

  const tutorMenuItems = [
      {
        key: "tutor-profile",
        label: "My Profile",
        icon: CgProfile,
        onClick: () => goTo("/tutor-profile"),
      },
      {
        key: "tutor-card-swipe",
        label: "Session Check-In",
        icon: FaRegAddressCard,
        onClick: () => goTo("/tutor/card-swipe"),
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
      menuItems={tutorMenuItems}
    />
  {/* ==================Mobile View ====================*/}
    <div className={`${styles.sidebar} ${!isMobile && isCollapsed ? styles.sidebarActive : ""}`}>
      <BaseSidebar isCollapsed={!isMobile && isCollapsed}>
        <div
          className={`${styles.burgerContainer} ${isCollapsed ? styles.burgerContainerActive : ""}`}
        >
          <div className={styles.burgerTrigger} onClick={toggleSidebar}></div>
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
              className={`${styles.liStudent} ${selected === "tutor-profile" ? styles.active : ""} ${styles.hiddenMobile}`}  //add hiddenMobile class for hiding item in mobile view
              onClick={() => goTo("/tutor-profile")}
            >
              <div className={styles.iconContainer}>
                <CgProfile className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>My Profile</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "availability" ? styles.active : ""}`} 
              onClick={() => goTo("/availability")}
            >
              <div className={styles.iconContainer}>
                <MdOutlineSchedule className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Set Availability</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "schedule" ? styles.active : ""}`} 
              onClick={() => goTo("/schedule")}
            >
              <div className={styles.iconContainer}>
                <SlCalender className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>View Calendar</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "sessions" ? styles.active : ""}`} 
              onClick={() => goTo("/sessions")}
            >
              <div className={styles.iconContainer}>
                <RiCalendarScheduleLine className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>My Sessions</span>
            </li>
            <li  
              className={`${styles.liTutor} ${selected === "tutor-card-swipe" ? styles.active : ""} ${styles.hiddenMobile}`}  //add hiddenMobile class for hiding item in mobile view 
              onClick={() => goTo("/tutor/card-swipe")}
            >
              <div className={styles.iconContainer}>
                <FaRegAddressCard className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Session Check-In</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "tutor-notifications" ? styles.active : ""}`} 
              onClick={() => goTo("/TutorNotifications")}
            >
              <div className={styles.iconContainer}>
                <IoMdNotificationsOutline className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Notifications</span>
            </li>
            <li 
              className={`${styles.liStudent} ${styles.hiddenMobile}`}  //add hiddenMobile class for hiding item in mobile view 
              onClick={handleLogout}
            >
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
}

export default TutorSidebar;