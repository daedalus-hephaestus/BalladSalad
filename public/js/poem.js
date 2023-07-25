let Poem = function (title, user, likes, dislikes, text, id, date, dashboard) {
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

	this.render(dashboard);
};
Poem.prototype.render = function (dashboard) {
	this.post.container = elem('div', 'post_container', this.id, '');
	this.post.post_container = elem('div', 'post', this.id, '');
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

	this.post.remove_poem = elem(
		'img',
		'remove_icon',
		this.id,
		'',
		'/images/trash.png',
		() => {
			saved_delete = this.id;
			delete_modal.style.display = 'block';
		}
	);

	this.post.author = elem('a', 'link', '', this.user, `/account/${this.user}`);
	this.post.poem_container = elem('div', 'poem_container', '', '');
	this.post.poem = elem(
		'p',
		'poem',
		'',
		`${this.text.replace(/\n/g, '<br />')}`
	);
	if (dashboard) {
		this.post.post_container.appendChild(this.post.remove_poem); // adds delete button
	}
	this.post.post_container.appendChild(this.post.title);
	this.post.post_container.appendChild(this.post.author);
	this.post.post_container.appendChild(
		document.createTextNode(` - ${convert_date(this.date)}`)
	);
	this.post.poem_container.appendChild(this.post.poem);
	this.post.post_container.appendChild(this.post.poem_container);
	this.post.feedback_container.appendChild(this.post.like);
	this.post.feedback_container.appendChild(this.post.dislike);
	this.post.post_container.appendChild(this.post.feedback_container);
	this.post.post_container.appendChild(document.createElement('br'));
	this.post.post_container.appendChild(this.post.like_counter);
	this.post.post_container.appendChild(this.post.dislike_counter);

	this.post.container.appendChild(this.post.binding);
	this.post.container.appendChild(this.post.post_container);
	this.post.container.style.transform = `rotate(${randomNum(-2, 2)}deg)`;

	content.appendChild(this.post.container); // add the paragraph to the word info div
};

function randomNum(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
