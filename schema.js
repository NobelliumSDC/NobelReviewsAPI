import mongoose from 'mongoose';
const { Schema } = mongoose;

const reviewsSchema = newSchema({
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