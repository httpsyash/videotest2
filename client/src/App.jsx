import React, { useState } from "react";
import VideoChat from "./VideoChat";

function App() {
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState("");
  const [roomID, setRoomID] = useState("");

  const handleJoin = () => {
    if (name && roomID) setJoined(true);
  };

  return (
    <div style={{ textAlign: "center" }}>
      {!joined ? (
        <div>
          <h2>Join a Meeting</h2>
          <input placeholder="Your Name" onChange={e => setName(e.target.value)} />
          <input placeholder="Meeting ID" onChange={e => setRoomID(e.target.value)} />
          <button onClick={handleJoin}>Join</button>
        </div>
      ) : (
        <VideoChat name={name} roomID={roomID} />
      )}
    </div>
  );
}

export default App;