const fs = require('fs');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const part = require(`./private/analysis`);

app.use(express.static(__dirname + '/public', { extensions: ['html'] })); // tells the app to use a public folder and remove the html extension

app.get('/', (req, res) => {

    res.sendFile(__dirname + '/public/index.html');

});
app.get('/login', (req, res) => {

    res.sendFile(`${__dirname}/public/html/login.html`);
    
});

let PetrarchanSonnet = new part.Poem(14, '0101010101', 'ABBAABBACDECDE');
let ShakespereanSonnet = new part.Poem(14, '0101010101', 'ABABCDCDEFEFGG');
let SpensereanSonnet = new part.Poem(14, '0101010101', 'ABABBCBCCDCDEE');
let Limerick = new part.Poem(5, ['0100100100', '00100100100', '001001', '01001', '00100100100'], 'AABBA');

io.sockets.on('connection', (socket) => {

    socket.on('test', async (data) => {

        console.clear();
        console.log(await ShakespereanSonnet.check(data.line));

    });

});

if (module === require.main) {

    const PORT = process.env.PORT || 8080;

    server.listen(PORT, () => {

        console.log(`App listening on ${PORT}`);
        console.log(`Press Ctrl+C to quit`);

    });

}