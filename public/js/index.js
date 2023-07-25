const socket = io();

socket.emit('get_username');

let content = document.getElementById('content');
let filter = document.getElementById('filter');

let posts = {};

socket.emit('get_poems', {
	type: filter.value,
	index: 0,
});

socket.on('username', (data) => {
	if (data) {
		document.getElementById('login_button').value = 'dashboard';
	}
});

socket.on('poem_list', (data) => {
	load_poems(data.list);
});

socket.on('update_feedback', (data) => {
	document.getElementById(`${data.id}_like_counter`).innerHTML = data.likes;
	document.getElementById(`${data.id}_dislike_counter`).innerHTML =
		data.dislikes;
});

filter.onchange = function () {
	socket.emit('get_poems', {
		type: filter.value,
		index: 0,
	});
};

function load_poems(data) {
	content.innerHTML = '';

	for (let i of data) {
		console.log(i);

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
