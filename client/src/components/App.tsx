import { initializeApp } from "firebase/app";
import "../styles/App.css";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
} from "@clerk/clerk-react";
import { useState, useEffect } from "react";
// import {ProvidenceLatLong.long } from "mapbox-gl"

// REMEMBER TO PUT YOUR API KEY IN A FOLDER THAT IS GITIGNORED!!
// (for instance, /src/private/api_key.tsx)
// import {API_KEY} from "./private/api_key"



function App() {
  return (
    <div className="App">
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignContent: "center",
              padding: "10px",
              gap: "10px",
            }}
          >
            <SignOutButton />
            <UserButton />
          </div>
        </div>
      </SignedIn>
    </div>
  );
}

export default App;
