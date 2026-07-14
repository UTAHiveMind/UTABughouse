import React from "react";
import styles from "../../styles/component/SideBar.module.css";
import {
MdClose,
MdLogout,
} from "react-icons/md";
import {
FaEnvelope,
FaPhone,
FaMapMarkerAlt,
} from "react-icons/fa";


// ==================Mobile View ====================
const MobileDrawer = ({isMobile, isMobileMenuOpen, setIsMobileMenuOpen, bugHouseInfo, handleLogout, menuItems = [], }) => {
    return (  
        <>
    {isMobile && (
        <div
          className={`${styles.mobileDrawer} ${
            isMobileMenuOpen ? styles.mobileDrawerOpen : ""
          }`}
        >
          
          <div className={styles.mobileDrawerHeader}>
            <img src={bugHouseInfo.logo} alt="BugHouse Logo" className={styles.sidebarLogoMobile}></img>
            <p className={styles.sidebarTitleMobile}>BugHouse</p>
            <button
              type="button"
              className={styles.mobileDrawerCloseButton}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close mobile menu"
            >
              <MdClose />
            </button>
          </div>

          {/* Loop through menuItems array and render each of them in the mobile view drawer */}
          {/* To modify menu items (labels, icons, navigation), update Admin/Tutor/StudentSidebar.js */}
          <div className={styles.mobileDrawerContent}>
            {menuItems?.map((item) => {
              return (
                <div>
                <button key={item.key}
                        type="button"
                        className={`${styles.mobileMenuItem} `}
                        onClick={item.onClick}>
                        <item.icon />
                        <span>{item.label}</span>
                </button>
                </div>
              );
            })}


            <div>
              <button
                type="button"
                className={styles.mobileLogoutButton}
                onClick={handleLogout}
              >
                <MdLogout />
                <span>Log Out</span>
              </button>
            </div>
          </div>

                      {/* call bughouseInfo function from hooks created for sharing data at once */}
            <div className={styles.mobileContactSection}>
              <h3 className={styles.mobileContactTitle}>Contact Us</h3>

              <a href={`mailto:${bugHouseInfo.contactInfo.email}`} className={styles.mobileContactItem} style={{ textDecoration: 'none' }}>
                <FaEnvelope className={styles.contactIcon} />
                <span>{bugHouseInfo.contactInfo.email}</span>
              </a>

              <a href={`tel:${bugHouseInfo.contactInfo.phone}`} className={styles.mobileContactItem} style={{ textDecoration: 'none' }}>
                <FaPhone className={styles.contactIcon} />
                <span>{bugHouseInfo.contactInfo.phone}</span>
              </a>

              <a href={`https://maps.google.com/?q=${encodeURIComponent(bugHouseInfo.contactInfo.address)}`} target="_blank" rel="noopener noreferrer" className={styles.mobileContactItem} style={{ textDecoration: 'none' }}>
                <FaMapMarkerAlt className={styles.contactIcon} />
                <span>{bugHouseInfo.contactInfo.address}</span>
              </a>
            </div>
        </div>
      )}
      </>
    );
};
export default MobileDrawer;
