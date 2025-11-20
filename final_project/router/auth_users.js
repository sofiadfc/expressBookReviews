const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = []; // Stores registered users

// Check if the username is valid (exists in records)
const isValid = (username) => {
    return users.some(user => user.username === username);
}

// Check if username and password match
const authenticatedUser = (username, password) => {
    return users.some(user => user.username === username && user.password === password);
}

// Only registered users can login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if user exists and password matches
    if (authenticatedUser(username, password)) {
        // Generate JWT token
        const token = jwt.sign({ username }, "fingerprint_customer", { expiresIn: "1h" });
        
        // Save token in session
        req.session = req.session || {}; // Ensure session object exists
        req.session.accessToken = token;

        return res.status(200).json({ message: "User successfully logged in", token });
    } else {
        return res.status(401).json({ message: "Invalid username or password" });
    }
});

// Add a book review
// Add or update a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const { review } = req.body;

    // Check if user is logged in
    if (!req.session || !req.session.accessToken) {
        return res.status(401).json({ message: "Unauthorized: Please login first" });
    }

    // Verify JWT token
    jwt.verify(req.session.accessToken, "fingerprint_customer", (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }

        const username = decoded.username;

        // Check if the book exists
        if (!books[isbn]) {
            return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
        }

        // Add or update the review
        books[isbn].reviews = books[isbn].reviews || {};
        books[isbn].reviews[username] = review;

        return res.status(200).json({ message: `Review added/updated for book ${isbn}`, reviews: books[isbn].reviews });
    });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;

    // Check if user is logged in
    if (!req.session || !req.session.accessToken) {
        return res.status(401).json({ message: "Unauthorized: Please login first" });
    }

    // Verify JWT token
    jwt.verify(req.session.accessToken, "fingerprint_customer", (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }

        const username = decoded.username;

        // Check if the book exists
        if (!books[isbn]) {
            return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
        }

        // Check if the user has a review to delete
        if (books[isbn].reviews && books[isbn].reviews[username]) {
            delete books[isbn].reviews[username]; // Delete the user's review
            return res.status(200).json({ message: `Review deleted for book ${isbn}`, reviews: books[isbn].reviews });
        } else {
            return res.status(404).json({ message: "No review found by this user for the specified book" });
        }
    });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;