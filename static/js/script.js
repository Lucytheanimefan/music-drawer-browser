var constraints = window.constraints = {
    audio: true,
    video: false
};

navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
  /* use the stream */
  console.log(stream);
}).catch(function(err) {
  /* handle the error */
});
