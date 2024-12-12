import "../styles/App.css";

function SelectGenre() {
  return (
    <div className="App">
      <div className="app">
        <h1 className="title">Select a Genre</h1>
        <div className="genre-buttons">
          <button className="genre-button">Rock</button>
          <button className="genre-button">Pop</button>
          <button className="genre-button">EDM</button>
          <button className="genre-button">Reggaeton</button>
        </div>
      </div>
    </div>
  );
}

export default SelectGenre;