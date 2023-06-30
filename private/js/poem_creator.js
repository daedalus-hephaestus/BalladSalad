const socket = io();
socket.emit('get_types');

let options = document.getElementById('meter');
let test = document.getElementById('test');
let output = document.getElementById('output');
let input = document.getElementById('poem_input');

input.addEventListener("keyup", () => {

    input.style.height = calc_height(input.value) + 'px';

});

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

        title: document.getElementById('title').value,
        line: document.getElementById('poem_input').value,
        meter: meter.value

    });

};

socket.on('errors', (data) => {

    display_errors(data);
    
});

function calc_height(value) {

    let line_breaks = (value.match(/\n/g) || []).length;

    console.log(line_breaks);

    let final = 15 + line_breaks * 20 + 25;

    return final;

}

function display_errors (data) {

    let errors = {

        line_number: '',
        dictionary: '',
        syllables: '',
        meter: '',
        rhyme: ''

    };

    for (let i of data) {

        console.log(i);

        if (i.reason === 'line_number') {

            errors.line_number = `${options.value}s require ${i.expected} lines, but your poem has ${i.actual}.<br><br>`;

        }

        if (i.reason === 'word') {

            errors.dictionary += `You used the word \"${i.word}\" in line ${i.line_number}, which isn't in our stress dictionary.<br><br>`;

        }

        if (i.reason === 'count') {

            errors.syllables += `Line ${i.line_number} should only have ${i.allowed} syllables, but it has ${i.total}<br><br>`;

        }

        if (i.reason === 'meter') {

            errors.meter += `The meter of line ${i.line_number} is ${i.adjusted.replace(/0/g, '-').replace(/1/g, '`')}, and should be ${i.required.replace(/0/g, '-').replace(/1/g, '`')}.<br><br>`;

        }

        if (i.reason === 'rhyme') {

            errors.rhyme += `\"${i.a}\" does not rhyme well with \"${i.b}\".<br><br>`;
        }
        
    }

    output.innerHTML = `${errors.line_number}${errors.dictionary}${errors.syllables}${errors.meter}${errors.rhyme}`;
    output.hidden = false;

}