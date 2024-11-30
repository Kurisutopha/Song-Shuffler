import "../styles/App.css";

function App() {
  console.log("App is rendering"); // Add this line to check if component is mounting

  return (
    <div className="App">
      <div className="app">
        <h1 className="title">Welcome to Chime In</h1>
        <button className="start-button">
          Start
        </button>
      </div>
    </div>
  );
}

export default App;