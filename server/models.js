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
    username_case: {

        type: String,
        required: true,
        unique: true

    },
    email_case: {

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

const ResetSchema = new Schema({

    email: {

        type: String,
        required: true,

    },
    createdAt: {

        type: Date,
        default: Date.now(),
        expires: 300

    },
    id: {

        type: String,
        required: true

    }

});
const Reset = mongoose.model('Reset', ResetSchema);

module.exports = { User, Reset };