const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({

    email: {

        type: String,
        required: true,
        unique: true

    },
    username: {

        type: String,
        required: true,
        unique: true

    },
    password: {

        type: String,
        required: true

    }

});
const User = mongoose.model('User', UserSchema); // second argument determines collection name

module.exports = { User };