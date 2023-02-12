let username = document.getElementById('username');
let email = document.getElementById('email');
let password1 = document.getElementById('password1');
let password2 = document.getElementById('password2');

email.onchange = function () {

    if (!email.value.includes('@')) {

        console.log(true);
        email.setCustomValidity('Do not mock us, for pity\'s sake, this address that you typed is fake!');

    } else {

        console.log(false);
        email.setCustomValidity('');

    }

};

password2.onchange = function () {

    if (password1.value !== password2.value) {

        password2.setCustomValidity('Of this fact you should feel shame, your secret words are not the same!');

    } else {

        password2.setCustomValidity('');

    }

};