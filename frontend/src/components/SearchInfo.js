import React from "react";
import styles from "../styles/ViewTutors.module.css";
import { BiArrowBack } from "react-icons/bi";

export const SearchInfo = ({setResults,allTutors,search,setClicked,clicked}) => {

    const handleClick = () => {
        setResults(allTutors);
        setClicked(true);
    };

    return (
            <div className={styles.searchInfoContent}>
            {
                clicked === true  ? (
                    <h1 className={styles.searchDefaultText}>      All Tutors</h1>
                ) : (
                    <div className = {styles.searchInfo}>
                        <h1 className={styles.searchText}>Search results for "{search}" </h1>
                        <button onClick = {handleClick} className = {styles.returnButton}>
                            <BiArrowBack />  Return to All Tutors
                        </button>
                    </div>
                )
            }
            </div>
    );
};


