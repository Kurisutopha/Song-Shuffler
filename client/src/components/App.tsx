import "../styles/App.css";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
//import GenreSelect from "./SelectGenera";
import GenreSelect from "./SelectGenre";
import HomePage from "../pages/HomePage";
import { SongProvider } from "./SongContext";
import { AuthProvider } from './AuthContext';
import Game from './Game';
import { Layout, MainHeading, Card } from './StyledComponents';
import PlaylistInput from './PlaylistInput';


window.global = window;

function Home() {
 const navigate = useNavigate();


 const handleStart = () => {
   navigate('/select-genre');
 };
/*
 const handleStart = () => {
  navigate('/homepage');
};*/



  return (
    <Layout>
      <MainHeading>Welcome to Chime In</MainHeading>
      <button className="start-button" onClick={handleStart}>
         Start
       </button>
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
  <SongProvider>
   <Router>
   <AuthProvider>
     <Routes>
       <Route path="/" element={<Home />} />
       <Route path="/select-genre" element={<GenreSelect />} />
       <Route path="/homepage" element={<HomePage />} />
     </Routes>
     </AuthProvider>
   </Router>
   </SongProvider>
 );
} 



/*
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/select-genre" element={<GenreSelect />} />
        <Route path="/homepage" element={<HomePage />} />

      </Routes>
    </Router>
  );
}
*/
export default App;