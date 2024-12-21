import React, { useState, useEffect, useRef, useCallback } from "react";
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { Client, IMessage, IFrame } from '@stomp/stompjs';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating unique IDs


// Set up WebSocket URL

const WEBSOCKET_URL = "http://18.118.254.198:8080/game-websocket";


function HomePage(){
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [score, setScore] = useState(0);
  const [playerId, setPlayerId] = useState(uuidv4());

  

  const clientRef = useRef<any>(null)
  const [isInitialized, setIsInitialized] = useState(false);

  const [canSubmit, setCanSubmit] = useState(true);
  const [waitingForOthers, setWaitingForOthers] = useState(false);
  console.log("HomePage mounted");


  


    useEffect(() => {
      if (clientRef.current) return;

      console.log("Attempting to connect to WebSocket server...");

    const socket = new SockJS(WEBSOCKET_URL); // SockJS connection
    const client = Stomp.over(socket);

    client.connect({}, ()=> {
      console.log("Connected to WebSocket server!");
      setStompClient(client);
      clientRef.current = client;
      setIsConnected(true);



      client.subscribe('/topic/game', (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log("Received message:", data);
          setMessage(data);
          if (data.type === "QUESTION"){
            const {options, questionText} = data.payload;
            console.log("Parsed question", questionText);
            setQuestion(questionText);
            setOptions(Array.isArray(options) ? options : []);
            setCanSubmit(true);
            setWaitingForOthers(false);
          }

          if (data.type === "PLAYERS_READY"){
            
            console.log('Player readied up')
          }

          if (data.type === "SCORE_UPDATE") {

            if(data.payload.playerId === playerId){
              setScore(data.payload.score);

            }
            console.log("Score update received:", data.payload);
          }

          if (data.type === "GAME_OVER"){
            const finalScores = data.payload.finalScores;
            alert(`Game Over! Your final score: ${finalScores[playerId] || 0}`);
          }

  
        } catch (error) {
          console.error("Error parsing received message:", error);
        }
      });


    

  });
    return () => {

      if (clientRef.current) {
        clientRef.current.disconnect();
        console.log("Disconnected from WebSocket server.");
              clientRef.current = null;
              setIsConnected(false);



      }
    };
      
},[]);

    


  

  const sendMessage = (destination: string, messageBody: any) => {
    if(isConnected){
      console.log('attempt29');
      stompClient.send(destination, {}, JSON.stringify(messageBody))
    
  } else {
    console.log("websocket invalid")
  }
}
    
  const handleGameStart = async () => {
    
    if (isConnected) {
      console.log('connected')
      sendMessage("/app/start", { type: "START_GAME" });
    } else {
      console.warn("Cannot start game. WebSocket is not connected.");
    }
  };

  const handleReadyUp = async () => {
    sendMessage("/app/player-ready", { 
      playerId: playerId 
    });

  }


  const handleSubmit = async () => {
    if (!canSubmit) {
      console.warn("Cannot submit at this moment.");
      return;
    }

    if (selectedOption) {
      sendMessage("/app/submit", { 
        playerId: playerId,
        answer: selectedOption 
      });
      
      // Prevent further submissions
      setCanSubmit(false);
      setWaitingForOthers(true);
    } else {
      console.warn("No option selected to submit.");
    }
  };

  return (
    <div>
      <h1>Game with React + WebSocket</h1>
      <h3>Player ID:{playerId}</h3>
      <button onClick={handleGameStart} disabled={!isConnected}>
        Start Game
      </button>
      <button onClick = {handleReadyUp}>
        Ready Up
      </button>
      <h3>Your Current Score: {score}</h3>
      {waitingForOthers && <p>Waiting for other players to submit...</p>}
      
      <div>
        <h4>Current Question:</h4>
        <p>{question}</p>
        <div>
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedOption(option)}
              disabled={!canSubmit}
              style={{
                backgroundColor: selectedOption === option ? "blue" : "white",
                opacity: canSubmit ? 1 : 0.5
              }}
            >
              {option}
            </button>
          ))}
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={!canSubmit || !selectedOption}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}

export default HomePage;


