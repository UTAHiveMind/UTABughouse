import React, { useState } from "react";
import { useSidebar } from "../../components/Sidebar/SidebarContext";
import AdminSidebar from "../../components/Sidebar/AdminSidebar";
import { axiosPostData } from "../../utils/api";
import styles from "../../styles/AdminEmail.module.css";

export default function AdminEmail() {
  const [allTutors, setAllTutors] = useState(false);
  const [allStudents, setAllStudents] = useState(false);
  const [extraEmails, setExtraEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const { isCollapsed } = useSidebar();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const response = await axiosPostData("/api/admin/send-mass-email", {
        allTutors,
        allStudents,
        extraEmails: extraEmails
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean),
        subject,
        message,
      });

      setStatus(`Sent to ${response.data.sentTo} recipients`);
    } catch (err) {
      setStatus(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className={styles.container}>
      <AdminSidebar selected="admin-email" />

      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
        <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
          <h1 className={styles.heading}>Admin Email</h1>
        </div>

        <div className={styles.adminCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.sectionCard}>
              <h3>Recipients</h3>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={allTutors}
                  onChange={(e) => setAllTutors(e.target.checked)}
                />
                All Tutors
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={allStudents}
                  onChange={(e) => setAllStudents(e.target.checked)}
                />
                All Students
              </label>

              <div className={styles.formGroup}>
                <label>Specific emails comma-separated:</label>
                <input
                  type="text"
                  value={extraEmails}
                  onChange={(e) => setExtraEmails(e.target.value)}
                  placeholder="example1@email.com, example2@email.com"
                />
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h3>Email Content</h3>

              <div className={styles.formGroup}>
                <label>Subject:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Message:</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.actionButton}>
              Send
            </button>
          </form>

          {status && <div className={styles.status}>{status}</div>}
        </div>
      </div>
    </div>
  );
}