const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || process.env.MONGOBD_URI;
console.log("URI is set:", !!uri);
