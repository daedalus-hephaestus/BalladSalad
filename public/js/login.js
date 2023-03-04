const socket = io();

if (window.location.href.includes(`incorrect`)) {

    document.getElementById('incorrect').innerHTML = `username or password is incorrect`;

}