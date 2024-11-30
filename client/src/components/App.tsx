import "../styles/App.css";

function App() {
  return (
    <div className="App">
      <div className="app">
        <h1 className="title">Welcome to Chime In</h1>
        <button className="start-button">
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

export default App;