import React from "react";
import styles from "../../styles/component/SideBar.module.css";
import { MdMenu } from "react-icons/md";

    // ==================Mobile View ====================
const MobileMenuTrigger = ({isMobile, isMobileMenuOpen, setIsMobileMenuOpen}) => {
    return (
    <>
    {isMobile && (
        <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open mobile menu"
        >
            <MdMenu className={styles.mobileMenuIcon} />
        </button>
    )}

        {/* Mobile overlay feature */}
    {isMobile && isMobileMenuOpen && (
        <div
            className={styles.mobileDrawerOverlay}
            onClick={() => setIsMobileMenuOpen(false)}
        />
    )}
    </>
    );
};
export default MobileMenuTrigger;
