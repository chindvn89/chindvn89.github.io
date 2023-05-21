$("#divChat").hide();

// socket processing
const socket = io('https://webrtc-jquery.herokuapp.com/');

socket.on('USER_LIST', arrUserInfo => {
    $("#divChat").show();
    $("#divRegister").hide();

    arrUserInfo.forEach(user => {
        const { userName, peerId } = user;
        $("#ulUsers").append(`<li id="${peerId}">${userName}</li>`);
    });

    socket.on('NEW_USER_REGISTERED', user => {
        const { userName, peerId } = user;
        $("#ulUsers").append(`<li id="${peerId}">${userName}</li>`);
    });
});

socket.on('REGISTER_FAILED', () => {
    alert('Register failed. Please choose another name!');
});

socket.on('ONE_USER_DISCONNECT', peerId => {
    $(`#${peerId}`).remove();
});

$("#ulUsers").on('click', 'li', function() {
    const remotePeerId = $(this).attr('id');
    console.log(remotePeerId);
    openStream().then(localMediaStream => {
        playStream('localStream', localMediaStream);
        const call = peer.call(remotePeerId, localMediaStream);
        call.on('stream', remoteMediaStream => {
            playStream('remoteStream', remoteMediaStream); // show received stream from remote peer
        })
    });
});

// --------------- declare functions
function openStream() {
    const config = {audio: false, video: true};
    return navigator.mediaDevices.getUserMedia(config);
}

function playStream(idVideoTag, stream) {
    let videoTag = document.getElementById(idVideoTag);
    videoTag.srcObject = stream;
    videoTag.play();
}

// ----------------- run
// make our browser is a peer in network (candidates are managed by peer server)
var peer = new Peer();
peer.on('open', function(id) {
	$("#mypeer").append(id);
    $("#btnSignUp").click(function() {
        let userName = $("#txtUserName").val();
        socket.emit('USER_SIGN_UP', {userName, peerId: id});
    });
});

// caller
$("#btnCallPeer").click(function(){
    const remotePeerId = $("#remoteId").val();
    openStream().then(localMediaStream => {
        playStream('localStream', localMediaStream);
        const call = peer.call(remotePeerId, localMediaStream);
        call.on('stream', remoteMediaStream => {
            playStream('remoteStream', remoteMediaStream); // show received stream from remote peer
        })
    });
});

// callee
peer.on('call', call => {
    openStream().then(localMediaStream => {
        playStream('localStream', localMediaStream);
        call.answer(localMediaStream);
        call.on('stream', remoteMediaStream => {
            playStream('remoteStream', remoteMediaStream);  // show received stream from remote peer
        })
    });
});
