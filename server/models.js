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

    },
    posts: {

        type: [String]

    },
    liked_poems: {

        type: [String]

    },
    disliked_poems: {

        type: [String]

    },

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

const PostSchema = new Schema({

    date: {

        type: Date,
        required: true

    },
    id: {

        type: String,
        required: true

    },
    user: {

        type: String,
        required: true

    },
    title: {

        type: String,
        required: true

    },
    text: {

        type: String,
        required: true

    },
    meter: {

        type: String,
        required: true

    },
    likes: {

        type: Number,
        default: 0

    },
    dislikes: {

        type: Number,
        default: 0

    }

});
const Post = mongoose.model('Post', PostSchema);

module.exports = { User, Reset, Post };