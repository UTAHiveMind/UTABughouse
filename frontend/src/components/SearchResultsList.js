import React from "react";
import "../styles/SearchResultsList.css";
import {SearchResult} from "./SearchResult";

export const SearchResultsList = ({results, /*resultsList*/}) => {
  return (
    <div className="results-list">
      { results.map((result,id) =>{
            return <SearchResult result = {result} key = {id} /> ;
        })
        /*resultsList.length !== 0 ? (
          resultsList.map((result,id) =>{
            return <SearchResult result = {result} key = {id} /> ;
          })
        ) : (
          null
        )*/
      }
    </div>
  );
};

