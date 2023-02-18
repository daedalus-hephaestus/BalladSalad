const fs = require('fs');
const express = require('express');
const session = require('express-session');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser'); // pulls values from html5 forms
const bcrypt = require('bcryptjs'); // encrypts user passwords
const uuid = require('uuid'); // generates uuids for password resets

const part = require(`./server/analysis`); // the poetry library
const mail = require(`./server/mailer.js`);
const { User } = require('./server/models.js');

const unauthStatic = express.static(`${__dirname}/public`, { extensions: ['html'] });
const authStatic = express.static(`${__dirname}/private`, { extensions: ['html'] });

const MongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const mongoURI = 'mongodb://localhost:27017/poetry';
mongoose.connect(mongoURI);

const db = mongoose.connection; // connects to the database
db.on('error', (error) => { // if the connection fails

    console.log(error);

});
db.once('open', () => { // if the database is successfully connected

    console.log(`${mongoURI} successfully connected`);

});
const store = new MongoDBSession({ // stores the express sessions so that users stay logged in

    uri: mongoURI,
    collection: 'sessions'

});
const sessionMiddleware = session({ // session middleware stores the session in the database

    secret: '***REMOVED***',
    resave: false,
    saveUninitialized: false,
    store: store

});
const isAuth = (req, res, next) => { // middleware function that checks to make sure users are authorized

    if (req.session.isAuth) {

        next();

    } else {

        res.redirect('/'); // redirects to the home page if the session is not authorized

    }

}

app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));

app.use(unauthStatic);
app.use((req, res, next) => {

    if (req.session.isAuth) {

       authStatic(req, res, next);

    }

});

//app.use(express.static(`${__dirname}/public`, { extensions: ['html'] })); // tells the app to use a public folder and remove the html extension

app.get('/', (req, res) => {

    res.sendFile(__dirname + '/public/index.html');

});
app.get('/login', (req, res) => {

    res.sendFile(`${__dirname}/public/html/login.html`);

});
app.get('/register', (req, res) => {

    res.sendFile(`${__dirname}/public/html/register.html`);

});
app.get('/dashboard', isAuth, (req, res) => {

    res.sendFile(`${__dirname}/public/html/register.html`);

});

app.post('/create_account', async (req, res) => {

    const { email, username, password } = req.body; // gets the submitted email and password from the inputs

    let user = await User.findOne({ email }); // checks to make sure the email is not in use

    if (user) { // if the email is in use

        return res.redirect('/'); // reload the page

    }

    user = await User.findOne({ username });

    if (user) {

        return res.redirect('/');

    }

    let id = await uuid.v1(); // generates a uuid
    let hash = await bcrypt.hash(password, 12); // hashes the password

    user = new User({

        email: email,
        username: username,
        password: hash,
        id: id

    });

    await user.save();

    return res.redirect('/');

});
app.post('/login', async (req, res) => {

    const { username, password } = req.body; // gets the user's email and password from the inputs

    let user = await User.findOne({ username }); // finds the user in the database

    if (!user) {

        user = await User.findOne({ email: username });

    }

    if (!user) { // if no user is found

        return res.redirect('/login'); // redirec to the login page

    }

    let isMatch = await bcrypt.compare(password, user.password); // bcrypt encrypts the password and compares the hashes

    if (!isMatch) { // if the passwords don't match

        return res.redirect('login'); // redirec to the login page

    }

    req.session.isAuth = true; // authorizes the user
    req.session.username = user.username; // saves the user's email in the session
    res.redirect('/dashboard'); // redirects to the dashboard

});
app.post('/logout', async (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            throw err;

        }

        res.redirect('/');

    });

});

//let PetrarchanSonnet = new part.Poem(14, '0101010101', 'ABBAABBACDECDE');
//let ShakespereanSonnet = new part.Poem(14, '0101010101', 'ABABCDCDEFEFGG');
//let SpensereanSonnet = new part.Poem(14, '0101010101', 'ABABBCBCCDCDEE');
//let Limerick = new part.Poem(5, ['0100100100', '00100100100', '001001', '01001', '00100100100'], 'AABBA');

io.use((socket, next) => {

    sessionMiddleware(socket.request, socket.request.res || {}, next);

});
io.sockets.on('connection', (socket) => {

    const s = socket.request.session; // gets the session information

    socket.on('test', async (data) => {

        // console.log(await ShakespereanSonnet.check(data.line));

    });

});

if (module === require.main) {

    const PORT = process.env.PORT || 8080;

    server.listen(PORT, () => {

        console.log(`App listening on ${PORT}`);
        console.log(`Press Ctrl+C to quit`);

    });

}