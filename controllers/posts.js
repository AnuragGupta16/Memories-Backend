import express from 'express';
import mongoose from 'mongoose';

import {Post, Comment} from '../models/Post.js';

const router = express.Router();

export const getPosts = async (req, res) => {
    const { page } = req.query;

    try {
        const LIMIT = 8;
        const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of every page

        const total = await Post.countDocuments({});
        const posts = await Post.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);

        res.status(200).json({ data: posts, currentPage: Number(page), numberOfPages: Math.ceil(total / LIMIT)});
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getPostsBySearch = async (req, res) => {
    const { searchQuery, tags } = req.query;

    try {
        const title = new RegExp(searchQuery, "i");

        const posts = await Post.find({ $or: [ { title }, { tags: { $in: tags.split(',') } } ]});

        res.status(200).json({ data: posts });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getPostsByCreator = async (req, res) => {
    const { name } = req.query;

    try {
        const posts = await Post.find({ name });

        res.status(200).json({ data: posts });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getPost=  async (req, res) => {
     const { id } = req.params;
    try{

        const post = await Post.findById(id);

        if (!post) {
            return null;
        }
        const populatedComments = await Promise.all(post.comments.map(async (commentId) => {
                return await populateComments(commentId);
        }));

        post.comments = populatedComments;

        res.status(200).json(post);
    } catch (error) {
        console.error('Error while fetching post details:', error);
        return null;
    }


}

// Recursive function to populate comments
async function populateComments(commentId) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
        return null;
    }


    const populatedChildren = [];
    for (const childId of comment.children) {
        const populatedChild = await populateComments(childId);
        populatedChildren.push(populatedChild);
    }


    comment.children = populatedChildren;

    return comment;
}


export const createPost = async (req, res) => {
    const post = req.body;

    const newPost = new Post({ ...post, creator: req.userId, createdAt: new Date().toISOString() })

    try {
        await newPost.save();

        res.status(201).json(newPost);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

export const updatePost = async (req, res) => {
    const { id } = req.params;
    const { title, message, creator, selectedFile, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No post with id: ${id}`);

    const updatedPost = { creator, title, message, tags, selectedFile, _id: id };

    await Post.findByIdAndUpdate(id, updatedPost, { new: true });

    res.status(200).json(updatedPost);
}

export const deletePost = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No post with id: ${id}`);

    await Post.findByIdAndRemove(id);

    res.status(200).json({ message: "Post deleted successfully." });
}

export const likePost = async (req, res) => {
    const { id } = req.params;

    if (!req.userId) {
        return res.json({ message: "Unauthenticated" });
      }

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No post with id: ${id}`);

    const post = await Post.findById(id);

    const index = post.likes.findIndex((id) => id ===String(req.userId));

    if (index === -1) {
      post.likes.push(req.userId);
    } else {
      post.likes = post.likes.filter((id) => id !== String(req.userId));
    }

    const updatedPost = await Post.findByIdAndUpdate(id, post, { new: true });

    res.status(200).json(updatedPost);
}

export const commentPost= async (req, res) => {
    const { id } = req.params;
    const { value} = req.body;
console.log(req.body);
    const {parentCommentId, newCommentText}=value;
    console.log(req.body);

    try {
        // Create a new comment
        const newComment = new Comment({
            text:newCommentText,
            user:null,
            createdAt: new Date(),
            children: []
        });


        await newComment.save();
let post;
        if (parentCommentId) {

            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) {
                throw new Error('Parent comment not found');
            }
            parentComment.children.push(newComment._id);
            await parentComment.save();
        } else {

            post = await Post.findById(id);
            if (!post) {
                throw new Error('Post not found');
            }
            post.comments.push(newComment._id);
            await post.save();
        }

      post = await Post.findById(id);
      const populatedComments = await Promise.all(post.comments.map(async (commentId) => {

                return await populateComments(commentId);

        }));


        post.comments = populatedComments;

        res.status(200).json(post);
    } catch (error) {
        console.error('Error while adding comment:', error);
        throw error;
    }
}

export default router;
