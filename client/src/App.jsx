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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white px-4">
      {!joined ? (
        <div className="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-3xl shadow-xl flex flex-col gap-4 w-full max-w-md text-center">
          <h2 className="text-3xl font-bold text-white">👋 Join a VibezMeet Room</h2>

          <input
            type="text"
            placeholder="Enter your name"
            className="p-3 rounded-xl text-black bg-white w-full outline-none focus:ring-2 ring-purple-300"
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Meeting ID"
            className="p-3 rounded-xl text-black bg-white w-full outline-none focus:ring-2 ring-pink-300"
            onChange={(e) => setRoomID(e.target.value)}
          />

          <button
            onClick={handleJoin}
            className="mt-4 bg-white text-purple-700 hover:bg-purple-100 font-semibold py-2 rounded-full transition-all"
          >
            🚀 Join Now
          </button>
        </div>
      ) : (
        <VideoChat name={name} roomID={roomID} />
      )}
    </div>
  );
}

export default App;
