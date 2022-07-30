require('dotenv').config();
const mongoose = require('mongoose');

const { Schema } = mongoose;

mongoose
  .connect(`mongodb://127.0.0.1:27017/${process.env.DB_NAME}`)
  .then(console.log('AHA MONGO MONGO'))
  .catch((err) => console.log(err, 'error connecting to db'));

const ReviewSchema = new Schema(
  {
    id: Number,
    rating: Number,
    body: String,
    summary: String,
    date: String,
    recommend: { type: Boolean, default: false },
    reported: { type: Boolean, default: false },
    response: { type: String, default: null },
    product_id: Number,
    helpfulness: { type: Number, default: 0 },
    reviewer_name: String,
    reviewer_email: String,
  },
);

const Review = mongoose.model('Review', ReviewSchema);

const PhotoSchema = new Schema({
  id: Number,
  review_id: Number,
  url: String,
});

const Photo = mongoose.model('Reviews_photo', PhotoSchema);

const CharacteristicSchema = new Schema({
  id: Number,
  name: String,
  product_id: Number,
});

const Characteristic = mongoose.model('Characteristic', CharacteristicSchema);

const CharReviewSchema = new Schema({
  id: Number,
  characteristic_id: Number,
  review_id: Number,
  value: Number,
});

const CharReview = mongoose.model('Characteristic_review', CharReviewSchema);

const findByProductId = (productId, sortInput, page, count) => {
  let sortOption = '';
  if (sortInput === 'relevance' || sortInput === 'helpfulness') {
    sortOption = '-helpfulness'; // default sort option will be helpfulness.
  }
  if (sortInput === 'newest') {
    sortOption = '-date';
  }
  return Review.aggregate()
    .match({ product_id: parseInt(productId), reported: false })
    .skip((parseInt(page) - 1) * parseInt(count))
    .limit(parseInt(count))
    .sort(sortOption)
    .lookup({
      from: 'reviews_photos',
      localField: 'id',
      foreignField: 'review_id',
      pipeline: [{
        $project: { _id: 0, review_id: 0 },
      }],
      as: 'photos',
    });
};

// findByProductId(5000, 'helpfulness', 1, 5)
//   .then((res) => console.log(res))

const getMetaInfo = (productId) => Review.aggregate()
  .match({ product_id: parseInt(productId), reported: false })
  .lookup({
    from: 'characteristic_reviews',
    localField: 'id',
    foreignField: 'review_id',
    as: 'char_reviews',
  })
  .lookup({
    from: 'characteristics',
    localField: 'product_id',
    foreignField: 'product_id',
    as: 'characteristics',
  })
  .project({
    summary: 0,
    body: 0,
    date: 0,
    reviewer_name: 0,
    reviewer_email: 0,
    response: 0,
    _id: 0,
    reported: 0,
    helpfulness: 0,
  });

// getMetaInfo(5000).then((res) => console.log(res));

const findChar = (productId) => Characteristic.find({ product_id: productId }).lean().exec();

const findPhotoUrls = (reviewId) => (
  Photo.find({ review_id: reviewId }).select('id url').lean().exec()
);

const createPhotosArray = (reviewId, photosArray) => (
  Review.updateOne({ id: reviewId }, { $set: { photos: photosArray } })
);

const transform = (reviewId) => (findPhotoUrls(reviewId) // find photoUrls of review id
  .then((res) => {
    const array = [];
    res.forEach((obj) => {
      array.push(obj.url); // push each url into an array
    });
    console.log(array);
    createPhotosArray(reviewId, array) // create a new field at reviewid
      .then((res) => console.log(res)); // where photos: array of urls
  })
);
const getPhotoUrlArray = async (reviewId) => {
  const array = [];
  const objs = await findPhotoUrls(reviewId);
  objs.forEach((obj) => {
    const newObj = { id: obj.id, url: obj.url }; // formatting
    array.push(newObj);
  });
  return array;
};

const bulkTransform = (n) => {
  const start = new Date().getTime();
  console.log('starting transformations . . .');
  const promises = [];
  for (let i = 1; i < n; i++) {
    promises.push(transform(i));
  }
  return Promise.all(promises)
    .then(async () => {
      await console.log('done running', n, 'amount of promises');
      const end = new Date().getTime();
      const time = end - start;
      await console.log('execution time:', Math.round(time / 1000), 'secs');
    });
};

const markHelpful = (reviewId) => Review.findOneAndUpdate({ id: reviewId }, { $inc: { helpfulness: 1 } }).exec();

const report = (reviewId) => Review.findOneAndUpdate({ id: reviewId }, { reported: true }).exec();

const findCharsByReview = (reviewId) => CharReview.find({ review_id: reviewId }).lean().exec();

const getLast = (option) => {
  if (option === 'review') {
    // return Review.find().sort({ _id: -1 }).limit(1).exec();
    return Review.aggregate()
      .match({})
      .sort({_id: -1})
      .limit(1)
      .lookup({
        from: 'characteristics',
        localField: 'product_id',
        foreignField: 'product_id',
        pipeline: [{
          $project: { _id: 0 },
        }],
        as: 'chars',
      });
  }
  if (option === 'photo') return Photo.aggregate().match({}).sort({ _id: -1 }).limit(1).exec();
  if (option === 'char') return Characteristic.aggregate().match({}).sort({ _id: -1 }).limit(1).exec();
  if (option === 'charreview') return CharReview.aggregate().match({}).sort({ _id: -1 }).limit(1).exec();
};

getLast('review').then((res) => console.log(res));

const create = (option, data) => {
  if (option === 'review') return Review.create(data).then((res) => console.log(res));
  if (option === 'photo') return Photo.create(data).then((res) => console.log(res));
  if (option === 'char') return Characteristic.create(data).then((res) => console.log(res));
  if (option === 'charreview') return CharReview.create(data).then((res) => console.log(res));
};

const getCharsForProduct = (productId) => Characteristic.find({ product_id: productId }).exec();

module.exports = {
  findByProductId,
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
  create,
  getCharsForProduct,
  getLast,
  getMetaInfo,
};
