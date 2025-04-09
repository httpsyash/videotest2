import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const socket = io(import.meta.env.VITE_API_URL);

function VideoChat({ name, roomID }) {
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      userVideo.current.srcObject = stream;

      socket.emit("join-room", { roomID, name });

      socket.on("all-users", users => {
        const newPeers = users.map(user => {
          const peer = createPeer(user.id, socket.id, stream, name);
          peersRef.current.push({ peerID: user.id, peer });
          return { peerID: user.id, peer, name: user.name };
        });
        setPeers(newPeers);
      });

      socket.on("user-joined", payload => {
        const peer = addPeer(payload.signal, payload.id, stream);
        peersRef.current.push({ peerID: payload.id, peer });
        setPeers(users => [...users, { peerID: payload.id, peer, name: payload.name }]);
      });

      socket.on("user-signal", payload => {
        const item = peersRef.current.find(p => p.peerID === payload.callerID);
        item?.peer.signal(payload.signal);
      });

      socket.on("receiving-returned-signal", payload => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        item?.peer.signal(payload.signal);
      });

      socket.on("user-left", id => {
        setPeers(prev => prev.filter(p => p.peerID !== id));
        peersRef.current = peersRef.current.filter(p => p.peerID !== id);
      });
    });
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

  return (
    <div>
      <h2>Meeting Room: {roomID}</h2>
      <video ref={userVideo} autoPlay muted style={{ width: "300px" }} />
      {peers.map(({ peerID, peer, name }) => (
        <Video key={peerID} peer={peer} name={name} />
      ))}
    </div>
  );
}

function Video({ peer, name }) {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", stream => {
      ref.current.srcObject = stream;
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