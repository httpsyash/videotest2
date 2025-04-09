import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { v4 as uuidv4 } from "uuid";

const socket = io(import.meta.env.VITE_API_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
});

function VideoChat({ name, roomID = uuidv4() }) {
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(currentStream => {
      setStream(currentStream);
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }

      setPeers(prev => [
        ...prev,
        {
          peerID: socket.id,
          peer: null,
          name,
          isSelf: true,
          stream: currentStream,
        },
      ]);

      socket.emit("join-room", { roomID, name });

      socket.on("all-users", users => {
        const newPeers = users.map(user => {
          const peer = createPeer(user.id, socket.id, currentStream, name);
          peersRef.current.push({ peerID: user.id, peer });
          return { peerID: user.id, peer, name: user.name };
        });
        setPeers(prev => [...prev, ...newPeers]);
      });

      socket.on("user-joined", payload => {
        const peer = addPeer(payload.signal, payload.id, currentStream);
        peersRef.current.push({ peerID: payload.id, peer });
        setPeers(users => [...users, { peerID: payload.id, peer, name: payload.name }]);
      });

      socket.on("user-signal", payload => {
        const item = peersRef.current.find(p => p.peerID === payload.callerID);
        if (!item) {
          const peer = addPeer(payload.signal, payload.callerID, currentStream);
          peersRef.current.push({ peerID: payload.callerID, peer });
          setPeers(prev => [...prev, { peerID: payload.callerID, peer, name: payload.name }]);
        } else {
          item.peer.signal(payload.signal);
        }
      });

      socket.on("receiving-returned-signal", payload => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        if (item?.peer && payload.signal) {
          item.peer.signal(payload.signal);
        }
      });

      socket.on("user-left", id => {
        setPeers(prev => prev.filter(p => p.peerID !== id));
        peersRef.current = peersRef.current.filter(p => p.peerID !== id);
      });
    });

    return () => {
      endCall(); // cleanup
    };
  }, []);

  function createPeer(userToSignal, callerID, stream, name) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", signal => {
      socket.emit("sending-signal", { userToSignal, callerID, signal, name });
    });
    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", signal => {
      socket.emit("returning-signal", { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  function toggleCamera() {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);
  }

  function toggleAudio() {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setAudioOn(audioTrack.enabled);
  }

  function endCall() {
    peersRef.current.forEach(({ peer }) => peer.destroy());
    socket.disconnect();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setPeers([]);
  }

  return (
    <div>
      <h2>Meeting Room: {roomID}</h2>

      {/* Controls */}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={toggleCamera}>
          {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
        </button>
        <button onClick={toggleAudio}>
          {audioOn ? "Turn Off Audio" : "Turn On Audio"}
        </button>
        <button onClick={endCall} style={{ backgroundColor: "red", color: "white" }}>
          End Call
        </button>
      </div>

      {/* Self Video */}
      <LocalVideo ref={userVideo} name={`${name} (You)`} />

      {/* Remote Peers */}
      {peers.map(({ peerID, peer, name, isSelf }) =>
        !isSelf && <Video key={peerID} peer={peer} name={name} />
      )}
    </div>
  );
}

const LocalVideo = React.forwardRef(({ name }, ref) => (
  <div>
    <h4>{name}</h4>
    <video ref={ref} autoPlay muted playsInline style={{ width: "300px" }} />
  </div>
));

function Video({ peer, name }) {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", stream => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <div>
      <h4>{name}</h4>
      <video ref={ref} autoPlay playsInline style={{ width: "300px" }} />
    </div>
  );
}

export default VideoChat;
