import "../styles/App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PlaylistInput from './PlaylistInput';
import Game from './Game';

function Home() {
  return (
    <div className="App">
      <div className="app">
        <h1 className="title">Welcome to Chime In</h1>
        <PlaylistInput />
        <p className="rules">
          Rules of the game: Enter a Spotify playlist URL and try to guess the songs!
          You'll hear a snippet of each song and need to guess the title or artist.
          The faster you guess correctly, the more points you'll earn!
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </Router>
  );
}

export default App;