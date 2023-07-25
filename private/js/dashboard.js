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

let Poem = function (title, user, likes, dislikes, text, id, date) {

    this.title = title;
    this.user = user;
    this.likes = likes;
    this.dislikes = dislikes;
    this.text = text;
    this.id = id;
    this.date = date;
    this.post = {};

    posts[this.id] = this;

    this.render();

};
Poem.prototype.render = function () {

    this.post.container = elem('div', 'post', this.id, ''); // the post container
    this.post.title = elem('h2', 'post_title', '', this.title); // the post title
    this.post.binding = elem('img', 'binding', `${this.id}_binding`, '', '/images/notebook.png');
    this.post.feedback_container = elem('div', 'feedback_container', '', '');
    this.post.like = elem('img', 'feedback like', this.id, '', '/images/like.png', () => {

        socket.emit('poem_feedback', { id: this.id, value: 1 });

    });

    this.post.dislike = elem('img', 'feedback dislike', this.id, '', '/images/dislike.png', () => {

        socket.emit('poem_feedback', { id: this.id, value: -1 });

    });
    // delete poem button
    this.post.remove_poem = elem('img', 'remove_icon', this.id, '', '/images/trash.png', () => {

        saved_delete = this.id;
        delete_modal.style.display = 'block';

    });

    this.post.like_counter = elem('span', 'like_counter', `${this.id}_like_counter`, this.likes); // like counter
    this.post.dislike_counter = elem('span', 'dislike_counter', `${this.id}_dislike_counter`, this.dislikes); // dislike counter
    this.post.author = elem('a', 'link', '', this.user, `/account/${this.user}`); // poem author
    this.post.poem_container = elem('div', 'poem_container', '', ''); // the poem container
    this.post.poem = elem('p', 'poem', '', `${this.text.replace(/\n/g, "<br />")}`); // the poem text

    this.post.container.appendChild(this.post.binding);
    this.post.container.appendChild(this.post.remove_poem); // adds delete button
    this.post.container.appendChild(document.createElement('br'));
    this.post.container.appendChild(this.post.title); // adds title
    this.post.container.appendChild(this.post.author); // adds author
    this.post.container.appendChild(document.createTextNode(` - ${convert_date(this.date)}`)); // adds the date posted
    this.post.poem_container.appendChild(this.post.poem); // adds the poem to the poem container
    this.post.container.appendChild(this.post.poem_container); // adds the poem container to the post container
    this.post.feedback_container.appendChild(this.post.like);
    this.post.feedback_container.appendChild(this.post.dislike);
    this.post.container.appendChild(this.post.feedback_container);
    this.post.container.appendChild(document.createElement('br'));
    this.post.container.appendChild(this.post.like_counter); // adds the like counter
    this.post.container.appendChild(this.post.dislike_counter); // adds the dislike counter

    this.post.container.style.transform = `rotate(${randomNum(-2, 2)}deg)`;

    content.appendChild(this.post.container); // add the paragraph to the word info div

};

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

        new Poem(i.title, i.user, i.likes, i.dislikes, i.text, i.id, i.date);

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
