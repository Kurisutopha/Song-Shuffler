import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Layout, MainHeading, Card } from './StyledComponents';
import PlaylistInput from './PlaylistInput';
import { AuthProvider } from './AuthContext';
import Game from './Game';
import HomePage from "../pages/HomePage";
import GenreSelect from "./SelectGenera";


window.global = window;

function Home() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/homepage');
  };
  return (
    <div className="App">
      <div className="app">
        <h1 className="title">Welcome to Chime In</h1>
        <button className="start-button" onClick={handleStart}>
          Start
        </button>
        <p className="rules">
          Rules of the game: Press start and select a genre of music, the game will play a snippet 
          of a random song 10 times. Guess the songs to win a point and link your spotify to add 
          them to your playlists!
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      {/* <AuthProvider> */}
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/game" element={<Game />} />  */}
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/select-genre" element={<GenreSelect />} />

        </Routes>
      {/* </AuthProvider> */}
    </Router>
  );
}



export default App;