import "../styles/App.css";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import GenreSelect from "./SelectGenre";


function Home() {
 const navigate = useNavigate();


 const handleStart = () => {
   navigate('/select-genre');
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
     </Routes>
   </Router>
 );
}


export default App;