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
} from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";

//mobile view
import useBugHouseInfo from "../../hooks/useBugHouseInfo";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import useMobileDrawer from "../../hooks/useMobileDrawer";
import useSidebarNavigation from "../../hooks/useSidebarNavigation";
import MobileMenuTrigger from "./MobileMenuTrigger";
import MobileDrawer from "./MobileDrawer";
//mobile view

const StudentSidebar = ({ selected }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();

  //======== Mobile Navigation State ========
  const {isMobile, isMobileMenuOpen, setIsMobileMenuOpen} = useMobileDrawer();
  //Handles page navigation and automatically closes the mobile drawer right after navigation
  const goTo = useSidebarNavigation(location, navigate, isMobile, setIsMobileMenuOpen);
  const bugHouseInfo = useBugHouseInfo(); //Fetching BugHouse Info and contact Info by using custom hook
  
  const studentMenuItems = [
    {
      key: "student-profile",
      label: "My Profile",
      icon: CgProfile,
      onClick: () => goTo("/student-profile"),
    },
    {
      key: "student-card-swipe",
      label: "Session Check-In",
      icon: FaRegAddressCard,
      onClick: () => goTo("/student/card-swipe"),
    },
    {
      key: "feedback",
      label: "Leave Feedback",
      icon: MdOutlineFeedback,
      onClick: () => goTo("/feedback"),
    }
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
      menuItems={studentMenuItems}
    />
    <div className={`${styles.sidebar} ${!isMobile && isCollapsed ? styles.sidebarActive : ""}`}>
      <BaseSidebar isCollapsed={!isMobile && isCollapsed}>
        <div className={`${styles.burgerContainer} ${isCollapsed ? styles.burgerContainerActive : ""}`}>
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
              className={`${styles.liStudent} ${selected === "student-profile" ? styles.active : ""} ${styles.hiddenMobile}`}  //add hiddenMobile class for hiding item in mobile view 
              onClick={() => goTo("/student-profile")}
            >
              <div className={styles.iconContainer}>
                <CgProfile className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>My Profile</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "find-tutors" ? styles.active : ""}`} 
              onClick={() => goTo("/find-tutors")}
            >
              <div className={styles.iconContainer}>
                <FaSearch className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Find Tutors</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "student-schedule" ? styles.active : ""}`} 
              onClick={() => goTo("/StudentSchedule")}
            >
              <div className={styles.iconContainer}>
                <AiOutlineSchedule className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Schedule a Session</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "my-sessions" ? styles.active : ""}`} 
              onClick={() => goTo("/my-sessions")}
            >
              <div className={styles.iconContainer}>
                <RiCalendarScheduleLine className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>My Sessions</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "student-card-swipe" ? styles.active : ""} ${styles.hiddenMobile}`}  //add hiddenMobile class for hiding item in mobile view
              onClick={() => goTo("/student/card-swipe")}
            >
              <div className={styles.iconContainer}>
                <FaRegAddressCard className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Session Check-In</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "feedback" ? styles.active : ""} ${styles.hiddenMobile}`}  //add hiddenMobile class for hiding item in mobile view
              onClick={() => goTo("/feedback")}
            >
              <div className={styles.iconContainer}>
                <MdOutlineFeedback className={styles.sidebarIcon} />
              </div>
              <span className={styles.aItem}>Leave Feedback</span>
            </li>
            <li 
              className={`${styles.liStudent} ${selected === "notifications" ? styles.active : ""}`} 
              onClick={() => goTo("/notifications")}
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
};

export default StudentSidebar;