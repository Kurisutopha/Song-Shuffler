
import React, { useState } from "react";
import { searchgeojson } from "../utils/api";
import { FeatureCollection } from "geojson";
import {overlayData } from "../utils/overlay";
import { Geometry, GeoJsonProperties } from "geojson";


interface SearchGeoProps {
  onSearch: React.Dispatch<
    React.SetStateAction<
      FeatureCollection<Geometry, GeoJsonProperties> | undefined
    >
  >;
  onSearches: React.Dispatch<{
    main: GeoJSON.FeatureCollection | undefined;
    search: GeoJSON.FeatureCollection | undefined;
  }>;
  overlays: {
    main: GeoJSON.FeatureCollection | undefined;
    search: GeoJSON.FeatureCollection | undefined;
  };
  setDoneSearching: React.Dispatch<boolean>;
}

export const SearchMap: React.FC<SearchGeoProps> = ({ onSearch, setDoneSearching, overlays, onSearches }) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSearch = async () => {
    const overlay2 = await searchgeojson(inputValue)
    console.log(overlay2)
    if (overlay2 == null || overlay2 == undefined) {
        setErrorMessage("Search did not yield any results. womp womp");
    } else {
        setErrorMessage("");
        let temp = overlays;
        temp.search = overlay2
        onSearches(temp)

        onSearch(overlayData(overlay2));
        
    }
    setDoneSearching(true);
    };


  return (
    <div>
      <input
        type="text"
        placeholder="Search Map"
        value={inputValue}
        onChange={handleInputChange}
      />
      <button onClick={handleSearch}>Search</button>
      {errorMessage ? <div>{errorMessage}</div>:<></>}
    </div>
);
};

