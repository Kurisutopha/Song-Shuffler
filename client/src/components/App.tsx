import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout, MainHeading, Card } from './StyledComponents';
import PlaylistInput from './PlaylistInput';
import { AuthProvider } from './AuthContext';
import Game from './Game';

function Home() {
  return (
    <Layout>
      <MainHeading>Welcome to Chime In</MainHeading>
      <Card>
        <PlaylistInput />
        <p className="text-gray-300 mt-6 text-center leading-relaxed">
          Rules of the game: Enter a Spotify playlist URL and try to guess the songs!
          You'll hear a snippet of each song and need to guess the title or artist.
          The faster you guess correctly, the more points you'll earn!
        </p>
      </Card>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/select-genre" element={<GenreSelect />} />
        <Route path="/homepage" element={<HomePage />} />

      </Routes>
    </Router>
  );
}

export default App;