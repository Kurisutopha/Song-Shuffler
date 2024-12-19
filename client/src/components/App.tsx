import "../styles/App.css";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
//import GenreSelect from "./SelectGenera";
//import GenreSelect from "./SelectGenre";
import HomePage from "../pages/HomePage";
import { SongProvider } from "./SongContext";
import { AuthProvider } from './AuthContext';
import Game from './Game';
import { Layout, MainHeading, Card } from './StyledComponents';
import PlaylistInput from './PlaylistInput';


//window.global = window;

function Home() {
 //const navigate = useNavigate();

/*
 const handleStart = () => {
   navigate('/select-genre');
 };
 */
/*
 const handleStart = () => {
  navigate('/homepage');
};*/



  return (
    <Layout>
      <MainHeading>Welcome to Chime In</MainHeading>
      {/*<button className="start-button" onClick={handleStart}>
         Start
       </button>*/}
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
       {/*<Route path="/select-genre" element={<GenreSelect />} />*/}
       <Route path="/homepage" element={<HomePage />} />
     </Routes>
     </AuthProvider>
   </Router>
   
 );
} 

export default App;