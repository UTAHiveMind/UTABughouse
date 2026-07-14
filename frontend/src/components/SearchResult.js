import React from "react";
import "../styles/SearchResult.css";

export const SearchResult = ({result}) => {
  return (
  <div
    className="search-result"
    onClick={(e) => alert(`You clicked on ${result.firstName + " " + result.lastName}`)}>
    {result.firstName + " " + result.lastName}
  </div>
  );
};
