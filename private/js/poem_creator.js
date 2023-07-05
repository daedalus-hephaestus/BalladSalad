const socket = io();
socket.emit('get_types');

let options = document.getElementById('meter');
let test = document.getElementById('test');
let output = document.getElementById('output');
let input = document.getElementById('poem_input');
let title = document.getElementById('title');

let publishable = false; // if the poem is publishable

input.addEventListener("keyup", () => {

    publishable = false; // makes the poem unpublishable
    input.style.height = calc_height(input.value) + 'px';

});

socket.on('poetry_types', (data) => { // gets the poetry types from the server

    for (let i in data) { // populates the selection with the different types of poems

        let o = document.createElement('option');
        o.value = i;
        o.innerHTML = i;

        options.appendChild(o);

    }

});

test.onclick = function () { // the test button

    output.hidden = true; // hides the error output

    if (publishable && title.value.length > 0) { // if the app is publishable and there is a title

        return socket.emit('publish_poem', { // publishes the poem

            title: document.getElementById('title').value,
            line: document.getElementById('poem_input').value,
            meter: meter.value

        });

    }

    if (title.value.length > 0) { // if there is a title

        socket.emit('test_poem', { // sends the poem to be evaluated by the server

            title: document.getElementById('title').value,
            line: document.getElementById('poem_input').value,
            meter: meter.value

        });

    } else { // if there is not a title

        title.focus();

    }

};

socket.on('errors', (data) => { // displays the errors in th epoem

    display_errors(data);

});
socket.on('poem_publishable', () => { // if the poem was deemed publishable by the server

    publishable = true;

});
socket.on('poem_published', () => { // redirects the user to the homepage

    window.location.href = '/';

});

function calc_height(value) { // calculates the required height for the poem input

    let line_breaks = (value.match(/\n/g) || []).length;

    console.log(line_breaks);

    let final = 15 + line_breaks * 20 + 25;

    return final;

}

// displays errors
function display_errors(data) {

    let errors = {

        line_number: '',
        dictionary: '',
        syllables: '',
        meter: '',
        rhyme: ''

    };

    for (let i of data) { // updates the error box with the different types of errors

        if (i.reason === 'line_number') { // poem has the wrong number of lines

            errors.line_number = `${options.value}s require ${i.expected} lines, but your poem has ${i.actual}.<br><br>`;

        }

        if (i.reason === 'word') { // poem has an invalid word

            errors.dictionary += `You used the word \"${i.word}\" in line ${i.line_number}, which isn't in our stress dictionary.<br><br>`;

        }

        if (i.reason === 'count') { // poem has the wrong number of syllables

            errors.syllables += `Line ${i.line_number} should only have ${i.allowed} syllables, but it has ${i.total}<br><br>`;

        }

        if (i.reason === 'meter') { // poem has an invalid meter

            errors.meter += `The meter of line ${i.line_number} is ${i.adjusted.replace(/0/g, '-').replace(/1/g, '`')}, and should be ${i.required.replace(/0/g, '-').replace(/1/g, '`')}.<br><br>`;

        }

        if (i.reason === 'rhyme') { // poem has an invalid rhyme

            errors.rhyme += `\"${i.a}\" does not rhyme well with \"${i.b}\".<br><br>`;
        }

    }

    if (data.length > 0) { // if there are errors

        // displays the errors
        output.innerHTML = `${errors.line_number}${errors.dictionary}${errors.syllables}${errors.meter}${errors.rhyme}`;

        if (publishable) { // if the poem is still publishable in spite of the errors

            output.innerHTML += `<br>Despite these errors, the poem is still publishable. Click publish again to post!`;

        }

        output.hidden = false;

    } else { // if there are no errors

        output.hidden = true;

    }

}