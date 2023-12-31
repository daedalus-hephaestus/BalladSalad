const fs = require('fs');
const express = require('express');
const session = require('express-session');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser'); // pulls values from html5 forms
const bcrypt = require('bcryptjs'); // encrypts user passwords
const uuid = require('uuid'); // generates uuids for password resets

const hidden_data = require(`./server/hidden_data`);
const part = require(`./server/analysis`); // the poetry library
const mail = require(`./server/mailer`);
const { User, Reset, Post } = require('./server/models.js');

const unauthStatic = express.static(`${__dirname}/public`, {
	extensions: ['html'],
});
const authStatic = express.static(`${__dirname}/private`, {
	extensions: ['html'],
});

const MongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const mongoURI = 'mongodb://127.0.0.1:27017/poetry';
mongoose.set('strictQuery', true);
mongoose.connect(mongoURI);

const poems = part.file_to_object(`${__dirname}/server/meters`);

let poem_lists = {
	// saves the lists of poems for quick display to the user

	recent: [],
	liked: [],
	hot: [],
};

refresh_lists();

for (let i in poems) {
	// stores the different poem types for easy access

	poems[i].form = new part.Poem(
		poems[i].lines,
		poems[i].meter,
		poems[i].rhymescheme,
		poems[i].repeatable,
		poems[i].meter_errors,
		poems[i].rhyme_errors
	);
}

const db = mongoose.connection; // connects to the database
db.on('error', (error) => {
	// if the connection fails

	console.log(error);
});
db.once('open', () => {
	// if the database is successfully connected

	console.log(`${mongoURI} successfully connected`);
});
const store = new MongoDBSession({
	// stores the express sessions so that users stay logged in

	uri: mongoURI,
	collection: 'sessions',
});
const sessionMiddleware = session({
	// session middleware stores the session in the database

	secret: hidden_data.mongoose_secret,
	resave: false,
	saveUninitialized: false,
	store: store,
});
const isAuth = (req, res, next) => {
	// middleware function that checks to make sure users are authorized

	if (req.session.isAuth) {
		next();
	} else {
		res.redirect('/login'); // redirects to the login page if the session is not authorized
	}
};

app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));

app.use(unauthStatic);
app.use((req, res, next) => {
	if (req.session.isAuth) {
		authStatic(req, res, next);
	} else {
		unauthStatic(req, res, next);
	}
});

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});
app.get('/login', (req, res) => {
	res.sendFile(`${__dirname}/public/html/login.html`);
});
app.get('/forgot', (req, res) => {
	res.sendFile(`${__dirname}/public/html/forgot.html`);
});
app.get('/incorrect', (req, res) => {
	res.sendFile(`${__dirname}/public/html/login.html`);
});
app.get('/reset/:id', async (req, res) => {
	const id = req.params.id; // pulls the uuid from the email link

	let reset = await Reset.findOne({ id }); // checks if the uuid is in the reset database

	if (!reset) {
		// if this reset request doesn't exist

		return res.redirect('/'); // sends the user back to the home page
	}

	return res.sendFile(`${__dirname}/public/html/reset.html`);
});
app.get('/account/:user', async (req, res) => {
	const username = req.params.user;

	let user = await User.findOne({ username_case: username });

	if (req.session.username === username) {
		res.redirect('/dashboard');
	}

	if (!user) {
		return res.sendFile(`${__dirname}/public/html/account_not_found.html`);
	}

	res.sendFile(`${__dirname}/public/html/account.html`);
});
app.get('/register', (req, res) => {
	res.sendFile(`${__dirname}/public/html/register.html`);
});
app.get('/dashboard', isAuth, (req, res) => {
	res.sendFile(`${__dirname}/public/html/register.html`);
});
app.get('/poem_creator', isAuth, (req, res) => {
	res.sendFile(`${__dirname}/public/html/poem_creator.html`);
});
app.get('/privacy', (req, res) => {
	res.sendFile(`${__dirname}/public/html/privacy.html`);
});
app.get('/sitemap.txt', (req, res) => {
	res.sendFile(`${__dirname}/server/sitemap.txt`);
});

app.post('/create_account', async (req, res) => {
	const { email, username, password } = req.body; // gets the submitted email and password from the inputs

	let user = await User.findOne({ email }); // checks to make sure the email is not in use

	if (user) {
		// if the email is in use

		return res.redirect('/'); // reload the page
	}

	user = await User.findOne({ username_case: username.toLowerCase() });

	if (user) {
		return res.redirect('/');
	}

	let id = await uuid.v1(); // generates a uuid
	let hash = await bcrypt.hash(password, 12); // hashes the password

	user = new User({
		email: email,
		username: username,
		email_case: email.toLowerCase(),
		username_case: username.toLowerCase(),
		password: hash,
		id: id,
	});

	await user.save();

	return res.redirect('/');
});
app.post('/login', async (req, res) => {
	const username = req.body.username.toLowerCase();
	const password = req.body.password;

	let user = await User.findOne({ username_case: username }); // finds the user in the database

	if (!user) {
		user = await User.findOne({ email_case: username });
	}

	if (!user) {
		// if no user is found

		return res.redirect('/incorrect'); // redirec to the login page
	}

	let isMatch = await bcrypt.compare(password, user.password); // bcrypt encrypts the password and compares the hashes

	if (!isMatch) {
		// if the passwords don't match

		return res.redirect('/incorrect'); // redirec to the login page
	}

	req.session.isAuth = true; // authorizes the user
	req.session.username = user.username_case; // saves the user's email in the session
	res.redirect('/dashboard'); // redirects to the dashboard
});
app.post('/forgot', async (req, res) => {
	const username = req.body.username.toLowerCase();

	let user = await User.findOne({ username_case: username }); // finds the user in the database

	if (!user) {
		user = await User.findOne({ email_case: username });
	}

	if (!user) {
		// if no user is found

		return res.redirect('/login'); // redirec to the login page
	}

	if (user) {
		// if the user exists

		let id = await uuid.v1(); // generates a uuid

		let reset = new Reset({
			// creates a new password reset entry in the database

			email: user.email_case,
			id: id,
		});

		await reset.save(); // saves the reset entry

		// sends an email with the reset link
		mail(
			`Password reset for ${user.email_case}`,
			`Please click on this link to reset your password: https://balladsalad.com/reset/${id}`,
			user.email_case
		);

		return res.redirect('/login');
	}
});
app.post('/logout', async (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			throw err;
		}

		res.redirect('/');
	});
});
app.post('/new_password', async (req, res) => {
	const { email, password, id } = req.body; // gets the email, new password, and uuid from the body

	let reset = await Reset.findOne({ id }); // checks to see if a request exists with the same idea

	if (!reset) {
		// if a request doesn't exist

		return res.redirect('/login'); // redirect to the homepage
	}

	if (reset.email === email.toLowerCase()) {
		// if the email in the database is the same as the one sent

		let user = await User.findOne({
			email_case: email.toLowerCase(),
		}); // finds the user with that email

		const hash = await bcrypt.hash(password, 12); // encrypts the new password

		user.password = hash; // updates the users password

		reset.delete(); // deletes the reset entry from the database
		user.save(); // saves the user

		return res.redirect('/login'); // redirects the user to the login page
	} else {
		return res.redirect('/login'); // redirects to the homepage
	}
});

io.use((socket, next) => {
	sessionMiddleware(socket.request, socket.request.res || {}, next);
});
io.sockets.on('connection', (socket) => {
	const s = socket.request.session; // gets the session information

	socket.on('get_username', () => {
		socket.emit('username', s.username);
	});
	socket.on('get_types', () => {
		socket.emit('poetry_types', poems);
	});
	socket.on('test_poem', async (data) => {
		let poem_data = poems[data.meter].form;
		let test_poem = await poem_data.check(data.line);

		let meter_errors = poem_data.meter_errors;
		let rhyme_errors = poem_data.rhyme_errors;

		if (poem_data.repeatable && test_poem.lines > poem_data.line_number) {
			meter_errors *= Math.round(test_poem.lines / poem_data.line_number);
			rhyme_errors *= Math.round(test_poem.lines / poem_data.line_number);
		}

		let publishable = true;

		for (let e of test_poem.errors) {
			if (
				e.reason === 'line_number' ||
				e.reason === 'word' ||
				e.reason === 'count'
			) {
				publishable = false;
			} else if (e.reason === 'rhyme') {
				rhyme_errors--;
			} else if (e.reason === 'meter') {
				meter_errors--;
			}
		}

		if (rhyme_errors < 0 || meter_errors < 0) {
			publishable = false;
		}

		if (publishable) {
			if (test_poem.errors.length === 0) {
				post_poem(data.title, s.username, data.line, data.meter);
				socket.emit('poem_published');
			} else {
				socket.emit('poem_publishable');
			}
		}

		socket.emit('errors', test_poem.errors);
	});
	socket.on('publish_poem', async (data) => {
		post_poem(data.title, s.username, data.line, data.meter);
		socket.emit('poem_published');
	});
	socket.on('check_email', async (data) => {
		// the client checking an email's availability

		const email = data.toLowerCase(); // the email address
		let user = await User.findOne({ email }); // searches the users to see if the email is in use

		if (user) {
			// if the email is in use

			socket.emit('email_result', 'unavailable');
		} else {
			// if the email isn't in use

			socket.emit('email_result', 'checked');
		}
	});
	socket.on('check_username', async (data) => {
		// the client checking a username's availability

		const username = data.toLowerCase(); // the username
		let user = await User.findOne({ username_case: username }); // searches the users to see if the username is in use

		if (user) {
			// if the username is in use

			socket.emit('username_result', 'unavailable');
		} else {
			// if the username isn't in use

			socket.emit('username_result', 'checked');
		}
	});
	socket.on('get_poems', async (data) => {
		socket.emit('poem_list', {
			list: poem_lists[data.type].slice(data.index, 10),
		});
	});
	socket.on('user_poems', async (data) => {
		let user = await User.findOne({ username_case: data.user });

		if (!user) {
			return;
		}

		let posts;

		if (data.type === 'liked') {
			posts = await Post.find({ user: data.user }, null, {
				sort: { likes: -1 },
			});
		} else {
			posts = await Post.find({ user: data.user }, null, {
				sort: { date: -1 },
			});
		}

		if (!posts) {
			return;
		}

		socket.emit('user_poems', { posts: posts, username: user.username });
	});
	socket.on('poem_feedback', async (data) => {
		if (s.username) {
			let id = data.id;
			let value = data.value;

			let user = await User.findOne({ username_case: s.username });

			if (!user) {
				return;
			}

			likeable = user.liked_poems;
			dislikeable = user.disliked_poems;

			let poem = await Post.findOne({ id: id });

			if (!poem) {
				return;
			}

			if (user.username_case === poem.user) {
				return;
			}

			if (likeable.includes(id)) {
				let index = likeable.indexOf(id);
				user.liked_poems.splice(index, 1);
				poem.likes--;
			} else if (value > 0) {
				poem.likes += value;
				likeable.push(id);
			}

			if (dislikeable.includes(id)) {
				let index = dislikeable.indexOf(id);
				user.disliked_poems.splice(index, 1);
				poem.dislikes--;
			} else if (value < 0) {
				poem.dislikes -= value;
				dislikeable.push(id);
			}

			await poem.save();
			await user.save();

			socket.emit('update_feedback', {
				id: id,
				likes: poem.likes,
				dislikes: poem.dislikes,
			});
			refresh_lists();
		} else {
			return;
		}
	});
	socket.on('delete_poem', async (data) => {
		let poem = await Post.deleteOne({ id: data, user: s.username });

		if (!poem) {
			return;
		}

		refresh_lists();
		socket.emit('refresh_page');
	});
});

async function post_poem(title, user, text, meter) {
	let id = await uuid.v1(); // generates a unique uuid for the poem

	while (await Post.findOne({ id })) {
		// checks to make sure the uuid isn't already in use

		id = await uuid.v1();
	}

	let user_data = await User.findOne({ username_case: user }); // finds the user in the database

	if (!user_data) {
		// if the user is not found

		return;
	}

	user_data.posts.unshift(id); // adds the uuid to the users data
	user_data.save(); // saves the user

	let data = {
		id: id,
		title: title,
		user: user,
		meter: meter,
		text: text,
		date: Date.now(),
	};

	poem_lists.recent.unshift(data); // adds the poem to the recent poems list

	let final = new Post(data); // creates a new post

	await final.save();

	refresh_lists();
}

async function refresh_lists() {
	// refreshes the lists of poems to display on the home page

	final = {
		recent: [],
		liked: [],
		hot: [],
	};

	let posts = await Post.find(null, null, { sort: { likes: -1 } }); // gets a list of all poems sorted by likes

	for (let i of posts) {
		final.liked.push(i);
	}

	posts.sort((a, b) => {
		// sorts the list by date created

		return b.date - a.date;
	});

	final.recent = posts;

	poem_lists = final;
}

if (module === require.main) {
	const PORT = process.env.PORT || 8080;

	server.listen(PORT, () => {
		console.log(`App listening on ${PORT}`);
		console.log(`Press Ctrl+C to quit`);
	});
}
