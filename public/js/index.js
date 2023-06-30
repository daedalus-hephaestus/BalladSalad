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

    this.post.container = document.createElement('div'); // create a paragraph element for each whitaker word
    this.post.container.id = this.id; // sets the paragraph's id
    this.post.container.className = 'post'; // sets the paragraph's class

    this.post.title = document.createElement('h2');
    this.post.title.className = 'post_title';
    this.post.title.appendChild(document.createTextNode(this.title));

    this.post.like = document.createElement('img');
    this.post.like.src = '/images/like.png';
    this.post.like.className = 'feedback';
    this.post.like.id = this.id;
    this.post.like.onclick = function () {

        socket.emit('poem_feedback', { id: this.id, value: 1 });

    }

    this.post.dislike = document.createElement('img');
    this.post.dislike.src = '/images/dislike.png';
    this.post.dislike.className = 'feedback';
    this.post.dislike.id = this.id;
    this.post.dislike.onclick = function () {

        socket.emit('poem_feedback', { id: this.id, value: -1 });

    }

    this.post.like_counter = document.createElement('span');
    this.post.like_counter.innerHTML = `${this.likes}`;
    this.post.like_counter.className = 'like_counter';
    this.post.like_counter.id = `${this.id}_like_counter`;

    this.post.dislike_counter = document.createElement('span');
    this.post.dislike_counter.innerHTML = `${this.dislikes}`;
    this.post.dislike_counter.className = 'dislike_counter';
    this.post.dislike_counter.id = `${this.id}_dislike_counter`;

    this.post.author = document.createElement('a');
    this.post.author.className = 'link';
    this.post.author.href = `/account/${this.user}`;
    this.post.author.appendChild(document.createTextNode(this.user));

    this.post.poem_container = document.createElement('div');
    this.post.poem_container.className = 'poem_container';

    this.post.poem = document.createElement('p');
    this.post.poem.className = 'poem';
    this.post.poem.innerHTML = (`${this.text.replace(/\n/g, "<br />")}`);

    this.post.container.appendChild(this.post.title);

    this.post.container.appendChild(this.post.author);
    this.post.container.innerHTML += ` - ${convert_date(this.date)}`;
    this.post.poem_container.appendChild(this.post.poem);
    this.post.container.appendChild(this.post.poem_container);
    this.post.container.appendChild(this.post.like);
    this.post.container.appendChild(this.post.dislike);
    this.post.container.appendChild(document.createElement('br'));
    this.post.container.appendChild(this.post.like_counter);
    this.post.container.appendChild(this.post.dislike_counter);

    content.appendChild(this.post.container); // add the paragraph to the word info div

};

socket.emit('get_poems', {

    type: filter.value,
    index: 0

});

socket.on('poem_list', (data) => {

    load_poems(data.list);

});

socket.on('update_feedback', (data) => {

    document.getElementById(`${data.id}_like_counter`).innerHTML = data.likes;
    document.getElementById(`${data.id}_dislike_counter`).innerHTML = data.dislikes;

});

filter.onchange = function () {

    socket.emit('get_poems', {

        type: filter.value,
        index: 0

    });

};

function load_poems(data) {

    content.innerHTML = '';

    for (let i of data) {

        console.log(i);

        new Poem(i.title, i.user, i.likes, i.dislikes, i.text, i.id, i.date);

    }

};

function convert_date(date) {

    let final = moment(date).format('MMMM Do YYYY, h:mm a');

    return final;

}