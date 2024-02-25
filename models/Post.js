import mongoose from 'mongoose';


const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    user: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

// Define the post schema
const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    name: String,
    creator: String,
    tags: [String],
    selectedFile: String,
    likes: {
        type: [String],
        default: []
    },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create models from the schemas
const Comment = mongoose.model('Comment', commentSchema);
const Post = mongoose.model('Post', postSchema);

export { Post, Comment };
