const socket = io();

let content = document.getElementById('content');
let filter = document.getElementById('filter');

let posts = {};

let username =
	window.location.href.split('/')[window.location.href.split('/').length - 1];

socket.emit('user_poems', { user: username, type: filter.value });

socket.on('update_feedback', (data) => {
	document.getElementById(`${data.id}_like_counter`).innerHTML = data.likes;
	document.getElementById(`${data.id}_dislike_counter`).innerHTML =
		data.dislikes;
});

socket.on('user_poems', (data) => {
	document.getElementById('name_display').innerHTML = data.username;
	load_poems(data.posts);
});

filter.onchange = function () {
	socket.emit('user_poems', { user: username, type: filter.value });
};

function load_poems(data) {
	content.innerHTML = '';

	for (let i of data) {
		new Poem(i.title, i.user, i.likes, i.dislikes, i.text, i.id, i.date);
	}
}

function convert_date(date) {
	let final = moment(date).format('MMMM Do YYYY, h:mm a');

	return final;
}

function elem(type, className, id, innerHTML, src, click) {
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
