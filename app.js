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
const { User, Reset } = require('./server/models.js');

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

        res.redirect('/login'); // redirects to the login page if the session is not authorized

    }

}

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

    if (!reset) { // if this reset request doesn't exist

        return res.redirect('/'); // sends the user back to the home page

    }

    res.sendFile(`${__dirname}/public/html/reset.html`);

});
app.get('/register', (req, res) => {

    res.sendFile(`${__dirname}/public/html/register.html`);

});
app.get('/dashboard', isAuth, (req, res) => {

    res.sendFile(`${__dirname}/public/html/register.html`);

});
app.get('/privacy', (req, res) => {

    res.sendFile(`${__dirname}/public/html/privacy.html`);

});

app.post('/create_account', async (req, res) => {

    const { email, username, password } = req.body; // gets the submitted email and password from the inputs

    let user = await User.findOne({ email }); // checks to make sure the email is not in use

    if (user) { // if the email is in use

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
        id: id

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

    if (!user) { // if no user is found

        return res.redirect('/incorrect'); // redirec to the login page

    }

    let isMatch = await bcrypt.compare(password, user.password); // bcrypt encrypts the password and compares the hashes

    if (!isMatch) { // if the passwords don't match

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
    
    if (!user) { // if no user is found

        return res.redirect('/login'); // redirec to the login page

    }

    if (user) { // if the user exists

        let id = await uuid.v1(); // generates a uuid

        let reset = new Reset({ // creates a new password reset entry in the database

            email: user.email_case,
            id: id

        });

        await reset.save(); // saves the reset entry

        // sends an email with the reset link
        mail(`Password reset for ${user.email_case}`, `Please click on this link to reset your password: https://balladsalad.com/reset/${id}`, user.email_case);
        
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

    if (!reset) { // if a request doesn't exist

        return res.redirect('/login'); // redirect to the homepage

    }

    if (reset.email === email.toLowerCase()) { // if the email in the database is the same as the one sent

        let user = await User.findOne({

            email_case: email.toLowerCase()
        
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
    socket.on('check_email', async (data) => { // the client checking an email's availability

        const email = data.toLowerCase(); // the email address
        let user = await User.findOne({ email }); // searches the users to see if the email is in use

        if (user) { // if the email is in use

            socket.emit('email_result', 'unavailable');

        } else { // if the email isn't in use

            socket.emit('email_result', 'checked');

        }

    });
    socket.on('check_username', async (data) => { // the client checking a username's availability

        const username = data.toLowerCase(); // the username
        let user = await User.findOne({ username_case: username }); // searches the users to see if the username is in use

        if (user) { // if the username is in use

            socket.emit('username_result', 'unavailable');

        } else { // if the username isn't in use

            socket.emit('username_result', 'checked');

        }

    });

});

if (module === require.main) {

    const PORT = process.env.PORT || 8080;

    server.listen(PORT, () => {

        console.log(`App listening on ${PORT}`);
        console.log(`Press Ctrl+C to quit`);

    });

}