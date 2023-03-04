const socket = io();
socket.emit('get_types');

let options = document.getElementById('meter');
let test = document.getElementById('test');
let output = document.getElementById('output');

socket.on('poetry_types', (data) => {

    for (let i in data) {

        let o = document.createElement('option');
        o.value = i;
        o.innerHTML = i;

        options.appendChild(o);

    }

    console.log(data);

});

test.onclick = function () {

    socket.emit('test_poem', {

        line: document.getElementById('line').value,
        meter: meter.value

    });

};

socket.on('errors', (data) => {

    output.innerHTML = JSON.stringify(data);
    
});