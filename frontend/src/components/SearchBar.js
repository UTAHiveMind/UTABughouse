import React, { useState, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import "../styles/SearchBar.css";
import axios from "axios";

// Get configuration from environment variables
const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";

// Construct the backend URL dynamically
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

export const SearchBar = ({ allTutors, setResults, /*setResultsList,*/ setSearch, setClicked}) => {
  //Will store user input
  const [input, setInput] = useState("");
  const debounceTimer = useRef(null);

  const handleSubmit = (e) => e.preventDefault();

  //Fetch relevant tutors from database
  const fetchFilteredTutors = async (value) => {
    if (value) {
      try {
      let response;

      // Use a simple heuristic: if value contains a digit or space, treat as course
      const isCourseQuery = /\d/.test(value) || value.trim().includes(" ");

      if (isCourseQuery) {
        response = await axios.get(`${BACKEND_URL}/api/users/tutors/by-course/${value}`);
      } else {
        response = await axios.get(`${BACKEND_URL}/api/users/tutors/${value}`);
      }

      setResults(response.data);
    } catch (error) {
      console.error("Error fetching tutors:", error);
      setResults([]); // fallback to empty
    }
    } else {
      //console.log("All Tutors");
      setResults(allTutors);

      //Stores list of suggestions under search bar if something has been entered
      //setResultsList(input);
    }
  };

  //Handles any changes in input in the searchbar
  const handleChange = (e) => {
    const value = e.target.value;

    //Returns list of suggestions under search bar if something has been entered
    //if (value) return setResultsList(value)
   
    //Stores value in input to be used for handleClick function
    setInput(value);
  };

  const handleClick = () => {
    //setting search result text
    setSearch(input);

    //If nothing has been entered so far, ALL TUTORS are returned
    if (!input) 
    {
      return setResults(allTutors)
    }
    else
    {
      setClicked(false);

      // Clear previous timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new debounce timer
      debounceTimer.current = setTimeout(() => {
        fetchFilteredTutors(input.trim());
      }, 300);
    }
  };

  return (
    <div className="input-wrapper" onSubmit={handleSubmit}>
      <FaSearch id="search-icon" />

      {/*Allows user to enter input in the searchbar*/}
      <input
        placeholder="Enter tutor or course name..."
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter")
              handleClick();
        }}
      />

      <button onClick = {handleClick} className="searchButton">
        {" "}
        Search{" "}
      </button>
    </div>
  );
};
