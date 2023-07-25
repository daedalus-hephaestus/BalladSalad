const socket = io();

let content = document.getElementById('content');
let filter = document.getElementById('filter');
let delete_modal = document.getElementById('delete_modal');

let username;

let saved_delete = '';

document.getElementById('cancel').onclick = function () {

    delete_modal.style.display = 'none';
    saved_delete = '';

};
document.getElementById('delete').onclick = function () {

    socket.emit('delete_poem', saved_delete);

};

let posts = {};

function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

socket.emit('get_username');
socket.on('username', (data) => {

    username = data;
    socket.emit('user_poems', { user: data, type: filter.value });

})
socket.on('update_feedback', (data) => {

    document.getElementById(`${data.id}_like_counter`).innerHTML = data.likes;
    document.getElementById(`${data.id}_dislike_counter`).innerHTML = data.dislikes;

});
socket.on('user_poems', (data) => {

    document.getElementById('name_display').innerHTML = data.username;
    load_poems(data.posts);

});

socket.on('refresh_page', () => {

    window.location.reload();

});

filter.onchange = function () {

    socket.emit('user_poems', { user: username, type: filter.value });

};

function load_poems(data) {

    content.innerHTML = '';

    for (let i of data) {

        new Poem(i.title, i.user, i.likes, i.dislikes, i.text, i.id, i.date, true);

    }

};

function convert_date(date) {

    let final = moment(date).format('MMMM Do YYYY, h:mm a');

    return final;

}

function elem (type, className, id, innerHTML, src, click) {

    let e = document.createElement(type);
    e.className = className;
    e.id = id;
    e.innerHTML = innerHTML;
    e.src = src;

    if (type === 'a') {

        e.href = src;

    }

    e.onclick = click;

    return e;

}
