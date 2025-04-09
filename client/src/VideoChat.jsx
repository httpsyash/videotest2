import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const socket = io(import.meta.env.VITE_API_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
});

function VideoChat({ name, roomID }) {
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      setPeers(prev => [
        ...prev,
        {
          peerID: socket.id,
          peer: null,
          name,
          isSelf: true,
          stream,
        },
      ]);

      socket.emit("join-room", { roomID, name });

      socket.on("all-users", users => {
        const newPeers = users.map(user => {
          const peer = createPeer(user.id, socket.id, stream, name);
          peersRef.current.push({ peerID: user.id, peer });
          return { peerID: user.id, peer, name: user.name };
        });
        setPeers(prev => [...prev, ...newPeers]);
      });

      socket.on("user-joined", payload => {
        const peer = addPeer(payload.signal, payload.id, stream);
        peersRef.current.push({ peerID: payload.id, peer });
        setPeers(users => [...users, { peerID: payload.id, peer, name: payload.name }]);

        // 🔄 Initiate connection back to new user to ensure all peers are connected
        const reversePeer = createPeer(payload.id, socket.id, stream, name);
        peersRef.current.push({ peerID: payload.id + "-reverse", peer: reversePeer }); // use suffix to avoid ID clash
        setPeers(users => [...users, { peerID: payload.id + "-reverse", peer: reversePeer, name: payload.name }]);
      });

      socket.on("user-signal", payload => {
        const existing = peersRef.current.find(p => p.peerID === payload.callerID);
        if (!existing) {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({ peerID: payload.callerID, peer });
          setPeers(prev => [...prev, { peerID: payload.callerID, peer, name: payload.name }]);
        } else {
          try {
            existing.peer.signal(payload.signal);
          } catch (err) {
            console.error("Error signaling peer:", err);
          }
        }
      });

      socket.on("receiving-returned-signal", payload => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        if (item?.peer && payload.signal) {
          try {
            item.peer.signal(payload.signal);
          } catch (err) {
            console.error("Error receiving returned signal:", err);
          }
        }
      });

      socket.on("user-left", id => {
        setPeers(prev => prev.filter(p => !p.peerID.startsWith(id)));
        peersRef.current = peersRef.current.filter(p => !p.peerID.startsWith(id));
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

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }

    return peer;
  }

  return (
    <div>
      <h2>Meeting Room: {roomID}</h2>

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
      } else {
        console.warn("Video ref not ready");
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
