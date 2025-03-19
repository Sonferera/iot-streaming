const socket = io();

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // STUN server gratis
    ]
};

// Akses kamera HP
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream; // Tampilkan video di HP
        localStream = stream;
        startSignaling(); // Mulai proses signaling
    })
    .catch(error => {
        console.error('Error accessing media devices:', error);
    });

function startSignaling() {
    peerConnection = new RTCPeerConnection(configuration);

    // Tambahkan stream lokal ke peer connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // Tangani ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate); // Kirim candidate ke signaling server
        }
    };

    // Tangani stream remote (di laptop)
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0]; // Tampilkan video di laptop
    };

    // Buat offer
    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
            socket.emit('offer', peerConnection.localDescription); // Kirim offer ke signaling server
        });

    // Tangani offer, answer, dan candidate dari signaling server
    socket.on('offer', (offer) => {
        peerConnection.setRemoteDescription(offer)
            .then(() => peerConnection.createAnswer())
            .then(answer => peerConnection.setLocalDescription(answer))
            .then(() => {
                socket.emit('answer', peerConnection.localDescription); // Kirim answer ke signaling server
            });
    });

    socket.on('answer', (answer) => {
        peerConnection.setRemoteDescription(answer);
    });

    socket.on('candidate', (candidate) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
}