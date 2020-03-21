var socket = new io.Socket('127.0.0.1:8081');
socket.connect();
socket.send('some data');
socket.addEvent('message', function(data){
	alert('got some data' + data);
});