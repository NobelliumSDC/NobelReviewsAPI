const { Photo, Review, transform, createPhotosArray,
  findPhotoUrls, bulkTransform,
} = require('./db.js');

Review.findOne({id:20551})
  .then(res => console.log(res))
Photo.findOne({review_id:20551})
  .then(res => console.log(res))

// // transform(501)
// //   .then(res => console.log(res));
//5774952
//  bulkTransform(100000)