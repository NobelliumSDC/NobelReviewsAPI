const { Photo, Review, transform, createPhotosArray,
  findPhotoUrls, bulkTransform,
} = require('./db.js');

const { toDate }= require('date-fns');


// Review.findOne({id:20551})
//   .then(res => console.log(res))
// Photo.findOne({review_id:20551})
//   .then(res => console.log(res))

// Review.find({product_id: 5})
//   .lean()
//   .exec()
//   .then((reviews) => {
//     reviews.forEach((review) => {
//       const isoDate = toDate(parseInt(review.date))
//       Review.update({product_id: 5}, {date: isoDate})
//         .then((res) => console.log(res, 'success'))
//     })
//   })


// // transform(501)
// //   .then(res => console.log(res));
//5774952
//  bulkTransform(100000)