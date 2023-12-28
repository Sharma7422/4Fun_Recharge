const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const diamondSchema = new Schema({
    diamond: {
        type: Number,
    },
    price: Number,
    extra: Number,
});

const Listing = mongoose.model("Listing", diamondSchema);
module.exports = Listing;