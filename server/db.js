require("dotenv").config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose
  .connect(`mongodb://127.0.0.1:27017/${process.env.DB_NAME}`)
  .then(console.log('Connected to MongoDB...'))
  .catch((err) => console.log(err, 'error connecting to db'));

const ReviewSchema = new Schema(
    {
      id: Number,
      rating: Number,
      body: String,
      summary: String,
      date: String,
      recommend: {type: Boolean, default: false},
      reported: {type: Boolean, default: false},
      response: {type: String, default: null},
      product_id: Number,
      helpfulness: {type: Number, default: 0},
      reviewer_name: String,
      reviewer_email: String,
})

const Review = mongoose.model('Review', ReviewSchema);

const PhotoSchema = new Schema({
  id: Number,
  review_id: Number,
  url: String,
})

const Photo = mongoose.model('Reviews_photo', PhotoSchema);

const CharacteristicSchema = new Schema({
  id: Number,
  name: String,
  product_id: Number,
})

const Characteristic = mongoose.model('Characteristic', CharacteristicSchema);

const CharReviewSchema = new Schema({
  id: Number,
  characteristic_id: Number,
  review_id: Number,
  value: Number,
})

const CharReview = mongoose.model('Characteristic_review', CharReviewSchema);



const findByProductId = (productId) => {
  return (
    Review.find({product_id:productId})
    .lean()
    // .limit(150)
    .exec()
    .catch(err => console.log(err))
    )
  };

const findChar = (productId) => {
  return Characteristic.find({product_id: productId}).lean().exec();
}

const findPhotoUrls = (reviewId) => {
  return (
    Photo.find({review_id: reviewId}).select('id url').lean().exec()
  )
}

const createPhotosArray = (reviewId, photosArray) => {
  return(
    Review.updateOne({id: reviewId}, {$set: {photos: photosArray}})
  )
}


const transform = (reviewId) => {
  // below code transforms!
  return (findPhotoUrls(reviewId)  // find photoUrls of review id
    .then(res => {
      let array = [];
      res.forEach((obj) => {
        array.push(obj.url);  // push each url into an array
      })
      console.log(array);
      createPhotosArray(reviewId, array) // create a new field at reviewid
        .then(res => console.log(res)) // where photos: array of urls
    })
  )
}

const getPhotoUrlArray = async (reviewId) => {
  let array = [];
  const objs = await findPhotoUrls(reviewId);
  objs.forEach(obj => {
    let newObj = {id: obj.id, url: obj.url}; // formatting
    array.push(newObj);
  });
  return array;
}

const bulkTransform = (n) => {
  const start = new Date().getTime();
  console.log('starting transformations . . .')
  let promises = [];
  for (let i = 1; i < n; i++) {
    promises.push(transform(i));
  }
  return Promise.all(promises)
    .then(async () => {
      await console.log('done running', n, 'amount of promises');
      const end = new Date().getTime();
      const time = end - start;
      await console.log('execution time:', Math.round(time/1000), 'secs');
    });
}

const create = (data) => {
  return Review.create(data)
   .then((res) => console.log(res));
}

const markHelpful = (reviewId) => {
  return Review.findOneAndUpdate({id: reviewId}, { $inc: {helpfulness: 1}}).exec();
}

const report = (reviewId) => {
  return Review.findOneAndUpdate({id: reviewId}, {reported: true}).exec();
}

const findCharsByReview = (reviewId) => {
  return CharReview.find({review_id: reviewId}).lean().exec();
}

const getLastReview = () => {
  return Review.find().sort({'_id': -1}).limit(1).exec()
}
const getLastPhoto = () => {
  return Photo.find().sort({'_id': -1}).limit(1).exec()
}
const getLastChar = () => {
  return Characteristic.find().sort({'_id': -1}).limit(1).exec()
}
const getLastCharReview = () => {
  return CharReview.find().sort({'_id': -1}).limit(1).exec()
}
getLastReview()
  .then((res) => console.log(res));
//   getLastPhoto()
//   .then((res) => console.log(res));
//   getLastChar()
//   .then((res) => console.log(res));
module.exports = {
  findByProductId,
  create,
  Photo,
  Review,
  transform,
  findPhotoUrls,
  createPhotosArray,
  bulkTransform,
  getPhotoUrlArray,
  markHelpful,
  report,
  findChar,
  findCharsByReview,
  getLastReview,
}