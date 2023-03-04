const socket = io();
let email = document.getElementById('email');
let password1 = document.getElementById('password1');
let password2 = document.getElementById('password2');
let submit = document.getElementById('submit');

document.getElementById('id').value = window.location.pathname.split('/')[2];

password2.onchange = function () {

    if (password1.value !== password2.value) {

        valid(password2, 'Of this fact you should feel shame, your secret words are not the same!');

    } else {

        valid(password2, '');
        
    }

};

function valid (input, message) {

    if (message.length > 0) {

        input.style.color = 'var(--red-salsa)';
        input.setCustomValidity(message);

    } else {

        input.style.color = 'var(--cg-blue)';
        input.setCustomValidity(message);

    }

}