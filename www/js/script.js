var socket = io.connect('http://localhost:8080');
var cookie = document.cookie;

function createButtonRoom(item, index) {
    var button = document.createElement("button");
    button.id = index;
    button.className = "btn btn-default joinRoom";

    var table = document.createElement("table");
    var rowName = table.insertRow(0);
    var title = rowName.insertCell(0);
    title.innerHTML = item.name;
    title.appendChild(document.createElement("hr"));

    var rowNickname1 = table.insertRow(1);
    rowNickname1.innerHTML = item.nickname1;

    var rowVS = table.insertRow(2);
    rowVS.innerHTML = "VS";

    var rowNickname2 = table.insertRow(3);
    if(item.nickname2 === null) {
        item.nickname2 = "POSTO LIBERO";
        rowNickname2.className ="nicknameDefault";
    }
    rowNickname2.innerHTML = item.nickname2;

    button.appendChild(table);
    var element = document.createElement("li");
    element.appendChild(button);
    return element;
}

function cancelGameWaiting() {
    socket.emit('cancelGameWaiting');
}

function cancelGameLoading() {
    socket.emit('cancelGameLoading');
}

function loginIntoRoom(key, password) {
    if(password) {
        password = sha1(password);
    } 
    socket.emit('joinIntoRoom', {data : {id: key, password}});
}

function createRoom(dataRoom) {
    if(dataRoom.password) {
        dataRoom.password = sha1(dataRoom.password);
    }
    socket.emit('createRoom', {data : dataRoom});
}

function communicate(data) {
    return new CustomEvent('refreshData', {'detail': data})
}

function loginUser(dataUser) {
    dataUser.password = sha1(dataUser.password);
    socket.emit('loginUser', {data: dataUser});
}

function registrationUser(dataUser) {
    dataUser.password = sha1(dataUser.password);
    socket.emit('registrationUser', {data: dataUser});
}

function dataUser() {
    socket.emit('dataUser');
}

function logout() {
    socket.emit('logout');
}

function matchReport() {
    socket.emit('matchReport');
}

function backToMain() {
    socket.emit('backToMain');
}

function backToMain() {
    socket.emit('backToMain');
}

function quickGame() {
    socket.emit('quickGame');
}

function removeCookie() {
    if(cookie.length > 0) {
        document.cookie = "key=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        document.cookie = "message=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    }
}

function setCookie(nameParams, paramsValue) {
    var d = new Date();
    d.setTime(d.getTime() + (1*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = nameParams + "=" + paramsValue + ";" + expires + ";";
}

function initializeMainGame() {
    socket.emit('updateSocket', $.cookie('key')).on('updateSocket', function() {
        dataUser();
        socket.emit('getRooms');
    });
}

function initializeFinishGame() {
    socket.emit('updateSocket', $.cookie('key')).on('updateSocket', function() {
        matchReport();
    });
}

socket.on('getRooms', function(rooms) {
    $("#roomList li").remove();
    if(rooms.length > 0) {
        var myList = $("#roomList");
        rooms.forEach( (item, index) => {
            myList.append(createButtonRoom(item, index));
        });
    }
    var event = communicate({'listRooms':rooms});
    document.dispatchEvent(event);
});

socket.on('busyRoom', function() {
    var event = communicate({'busyRoom':{}});
    document.dispatchEvent(event);
});

socket.on('passwordError', function() {
    var event = communicate({'passwordError':{}});
    document.dispatchEvent(event);
});

socket.on('redirect', function(destination) {
    var key = Object.keys(destination)[1];
    var value = Object.values(destination);
    if (key == 'key') {
        setCookie(key, value[1]);
    }
    else if (key == 'message') {
        setCookie(key, value[1]);
    }
    window.location.replace(value[0]);
});

socket.on('dataUser', function(data) {
    var event = communicate({'dataUser': data});
    document.dispatchEvent(event);
});

socket.on('waitingPlayer', function() {
    var event = communicate({'waitingPlayer':{}});
    document.dispatchEvent(event);
});

socket.on('waitingGame', function() {
    var event = communicate({'waitingGame':{}});
    document.dispatchEvent(event);
});

socket.on('eraseRoom', function() {
    var event = communicate({'eraseRoom':{}});
    document.dispatchEvent(event);
});

socket.on('matchReport', function(data) {
    var event = communicate({'matchReport':{data}});
    document.dispatchEvent(event);
});

socket.on('notFoundRoom', function() {
    var event = communicate({'notFoundRoom':{}});
    document.dispatchEvent(event);
});