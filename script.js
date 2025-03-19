const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startButton = document.getElementById("startStream");

let peerConnection;
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

startButton.onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    localVideo.srcObject = stream;
    
    peerConnection = new RTCPeerConnection(config);
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("ice-candidate", event.candidate);
        }
    };
    
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);
};

socket.on("offer", async offer => {
    peerConnection = new RTCPeerConnection(config);
    
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("ice-candidate", event.candidate);
        }
    };
    
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

socket.on("answer", async answer => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("ice-candidate", async candidate => {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
