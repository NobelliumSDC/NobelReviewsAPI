require("dotenv").config();
const mongoose = require("mongoose");

// It's not a good idea to hardcode connection credentials here.
// Configure process.env variables in ../.env and use them
// in your connection code: e.g. process.env.DB_NAME

// TODO: Set up a connection to the "expresso" MongoDB database
mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.DB_NAME}`); // Fix this string

const { Schema } = mongoose;

const reviewSchema = newSchema({
  review_id: Number,
  rating: Number,
  summary: String,
  photos: [{
    id: Number,
    url: String
  }],
  date: String,
  recommend: Boolean,
  response: String,
  product_id: Number,
  helpfulness: Number,
  reviewer_name: String,
  email: String,
  characteristics: Object,
})

const Review = new mongoose.model('Review', reviewSchema); //  TODO: Fill in arguments!


module.exports = Review;