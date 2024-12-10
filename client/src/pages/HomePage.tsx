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
  const [playerId, setplayerId] = useState(null);

  const clientRef = useRef<any>(null)
  const [isInitialized, setIsInitialized] = useState(false);
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
          }

          if (data.type === "SCORE_UPDATE") {
            console.log("Score update received:", data.payload);
            setScore(data.payload.score);
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


  const handleSubmit = async () => {
    if (selectedOption) {
      sendMessage("/app/submit", { playerId: playerId ,answer: selectedOption });
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
      <h3>Current Score: {score}</h3>
      <div>
        <h4>Current Question:</h4>
        <p>{question}</p>
        <div>
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedOption(option)}
              style={{
                backgroundColor: selectedOption === option ? "blue" : "white",
              }}
            >
              {option}
            </button>
          ))}
        </div>
        <button onClick={handleSubmit}>Submit Answer</button>
      </div>
    </div>
  );
}

export default HomePage;


