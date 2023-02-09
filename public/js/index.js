const socket = io();

let test = document.getElementById('test');
let meter = document.getElementById('meter');
let line = document.getElementById('line');

meter.addEventListener('keyup', function onEvent(e) {

    if (e.keyCode === 13) {

        line.focus();

    }

});
test.onclick = function () {

    socket.emit('test', {

        meter: `${meter.value}`,
        line: `${line.value.toLowerCase()}`,

    });

};

socket.on('output', (data) => {

    document.getElementById('output').innerHTML = parse_error(data);

});

function parse_error(data) {

    var reasons = '';

    console.log(data);

    if (data === true) {

        return 'The following line matches the chosen meter.'

    }

    for (var i of data) {

        if (i.reason === 'word') {

            reasons += `\"${i.word}\" was not found in our dictionary.`

        } else if (i.reason === 'count') {

            reasons += `You have ${i.total} syllable`;

            if (i.total !== 1) {

                reasons += `s`;

            }

            reasons += `, while your meter requires ${i.allowed} syllable`

            if (i.allowed !== 1) {

                reasons += `s`;

            }
            reasons += '.';

        } else if (i.reason === 'meter') {

            reasons += `Your poem has a meter of ${i.adjusted}, yet it should be ${i.required}.`;

        }

        reasons += '<br>';

    }

    return reasons;

}