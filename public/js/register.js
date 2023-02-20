const socket = io();
let username = document.getElementById('username');
let email = document.getElementById('email');
let password1 = document.getElementById('password1');
let password2 = document.getElementById('password2');
let submit = document.getElementById('submit');

let email_in_use = 'unchecked';
let username_in_use = 'unchecked';

socket.on('email_result', (data) => { // the server sending an email's availability

    email_in_use = data; // updates the availability variable
    if (username_in_use === 'unchecked') { // if the username is unchecked

        socket.emit('check_username', `${username.value}`); // tells the server to check the username's availability

    }

});
socket.on('username_result', (data) => { // the server sending a username's availability

    username_in_use = data; // updates the availability variable
    submit.click(); // resubmits the form

});

username.onchange = function () {

    username_in_use = 'unchecked';

    if (!username.value.match(/^[0-9a-zA-Z]+$/)) {

        valid(username, 'Only letters you must choose, though numbers you may also use.');

    } else {

        valid(username, '');

    }

};

email.onchange = function () {

    email_in_use = 'unchecked';

    if (!email.value.includes('@')) {

        valid(email, 'Do not mock us, for pity\'s sake, this address that you typed is fake!');

    } else {

        valid(email, '');

    }

};

password2.onchange = function () {

    if (password1.value !== password2.value) {

        valid(password2, 'Of this fact you should feel shame, your secret words are not the same!');

    } else {

        valid(password2, '');
        
    }

};

submit.addEventListener('click', (event) => {

    if (email_in_use === 'unchecked') { // checks if the email has been verified

        socket.emit('check_email', `${email.value}`); // asks the server if the email is already in use
        event.preventDefault(); // prevents the default submit action

    }

    if (username_in_use === 'unavailable') { // if the username is unavailable

        valid(username, 'Your name is fair, it\'s not the worst, but sadly someone got there first.')

    }
    if (email_in_use === 'unavailable') { // if the email is unavailable

        valid(email, 'Another you will have to choose, because this email you can\'t use');

    }

});

function valid (input, message) {

    if (message.length > 0) {

        input.style.color = 'var(--red-salsa)';
        input.setCustomValidity(message);

    } else {

        input.style.color = 'var(--cg-blue)';
        input.setCustomValidity(message);

    }

}