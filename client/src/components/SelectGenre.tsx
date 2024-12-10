import React from "react";
import "../styles/App.css";

function SelectGenre() {
  const fetchSongs = async (genre: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/songs?genre=${genre}');
      if (!response.ok){
        throw new Error("Failed to fetch songs");
      }
      const songs = await response.json();
      console.log("Fetched songs: ", songs);
    
    } catch (error){
      console.error("Error fetching songs: ", error);
    }
  }
  return (
    <div className="App">
      <div className="app">
        <h1 className="title">Select a Genre</h1>
        <div className="genre-buttons">
          <button className="genre-button" onClick={() => fetchSongs("rock")}>Rock</button>
          <button className="genre-button" onClick={() => fetchSongs("pop")}>Pop</button>
          <button className="genre-button" onClick={() => fetchSongs("edm")}>EDM</button>
          <button className="genre-button" onClick={() => fetchSongs("reggaeton")}>Reggaeton</button>
        </div>
      </div>
    </div>
  );
}

export default SelectGenre;