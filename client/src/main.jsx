import React, { useRef, useState, useEffect } from "react";

const VideoChat = ({ localVideoRef, peers }) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const toggleMic = () => setMicOn(prev => !prev);
  const toggleCam = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getVideoTracks().forEach(track => {
        track.enabled = !camOn;
      });
    }
    setCamOn(prev => !prev);
  };

  return (
    <div className="bg-zinc-900 text-white min-h-screen p-4 flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-4 text-purple-400">VibezMeet Room 💬</h2>
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <div className="relative">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-60 h-40 bg-black rounded-2xl shadow-lg" />
          <p className="absolute bottom-1 left-2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded">You</p>
        </div>
        {Object.values(peers).map((peer, idx) => (
          <div key={idx} className="relative">
            <video ref={peer.videoRef} autoPlay playsInline className="w-60 h-40 bg-black rounded-2xl shadow-lg" />
            <p className="absolute bottom-1 left-2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded">{peer.name}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        <button
          onClick={toggleMic}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
            micOn ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {micOn ? "Mic On 🎙️" : "Mic Off 🔇"}
        </button>
        <button
          onClick={toggleCam}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
            camOn ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {camOn ? "Cam On 🎥" : "Cam Off 🚫"}
        </button>
      </div>
    </div>
  );
};

export default VideoChat;
