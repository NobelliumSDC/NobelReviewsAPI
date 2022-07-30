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
  })

// getMetaInfo(500).then((res) => console.log(res));

const markHelpful = (reviewId) => Review.findOneAndUpdate({ id: reviewId }, { $inc: { helpfulness: 1 } }).exec();

const report = (reviewId) => Review.findOneAndUpdate({ id: reviewId }, { reported: true }).exec();

const getLast = (option) => {
  if (option === 'review') {
    return Review.aggregate()
      .match({})
      .sort({ _id: -1 })
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

// getLast('review').then((res) => console.log(res));

const create = (option, data) => {
  if (option === 'review') return Review.create(data).then((res) => console.log(res));
  if (option === 'photo') return Photo.create(data).then((res) => console.log(res));
  if (option === 'char') return Characteristic.create(data).then((res) => console.log(res));
  if (option === 'charreview') return CharReview.create(data).then((res) => console.log(res));
};

module.exports = {
  findByProductId,
  Photo,
  Review,
  markHelpful,
  report,
  create,
  getLast,
  getMetaInfo,
};
