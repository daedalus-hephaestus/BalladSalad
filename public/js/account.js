const socket = io();

let content = document.getElementById('content');
let filter = document.getElementById('filter');

let posts = {};

let Poem = function (title, user, likes, dislikes, text, id, date) {
	this.title = title;
	this.user = user;
	this.likes = likes;
	this.dislikes = dislikes;
	this.text = text;
	this.id = id;
	this.date = date;
	this.post = {};

	console.log(this.id);
	posts[this.id] = this;

	this.render();
};
Poem.prototype.render = function () {
	this.post.container = elem('div', 'post', this.id, '');

	this.post.binding = elem(
		'img',
		'binding',
		`${this.id}_binding`,
		'',
		'/images/notebook.png'
	);

	this.post.title = elem('h2', 'post_title', '', this.title);

	this.post.feedback_container = elem('div', 'feedback_container', '', '');
	this.post.like = elem(
		'img',
		'feedback like',
		this.id,
		'',
		'/images/like.png',
		() => {
			socket.emit('poem_feedback', { id: this.id, value: 1 });
		}
	);

	this.post.dislike = elem(
		'img',
		'feedback dislike',
		this.id,
		'',
		'/images/dislike.png',
		() => {
			socket.emit('poem_feedback', { id: this.id, value: -1 });
		}
	);

	this.post.like_counter = elem(
		'span',
		'like_counter',
		`${this.id}_like_counter`,
		this.likes
	);
	this.post.dislike_counter = elem(
		'span',
		'dislike_counter',
		`${this.id}_dislike_counter`,
		this.dislikes
	);
	this.post.author = elem('a', 'link', '', this.user, `/account/${this.user}`);
	this.post.poem_container = elem('div', 'poem_container', '', '');
	this.post.poem = elem(
		'p',
		'poem',
		'',
		`${this.text.replace(/\n/g, '<br />')}`
	);

	this.post.container.appendChild(this.post.binding);
	this.post.container.appendChild(this.post.title);
	this.post.container.appendChild(this.post.author);
	this.post.container.innerHTML += ` - ${convert_date(this.date)}`;
	this.post.poem_container.appendChild(this.post.poem);
	this.post.container.appendChild(this.post.poem_container);
	this.post.feedback_container.appendChild(this.post.like);
	this.post.feedback_container.appendChild(this.post.dislike);
	this.post.container.appendChild(this.post.feedback_container);
	this.post.container.appendChild(document.createElement('br'));
	this.post.container.appendChild(this.post.like_counter);
	this.post.container.appendChild(this.post.dislike_counter);

	this.post.container.style.transform = `rotate(${randomNum(-2, 2)}deg)`;

	content.appendChild(this.post.container); // add the paragraph to the word info div
};

function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

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
