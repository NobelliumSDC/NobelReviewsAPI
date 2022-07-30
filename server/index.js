/* eslint-disable no-plusplus */
/* eslint-disable import/extensions */
/* eslint-disable no-unused-expressions */
/* eslint-disable guard-for-in */
/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
require('dotenv').config();
const express = require('express');
const path = require('path');
const { toDate, parseISO }= require('date-fns');
require('newrelic');

const app = express();

app.use(express.static(path.join(__dirname, '../client/public')));
app.use(express.json());
const db = require('./db.js');

app.get('/reviews', (req, res) => {
  const id = req.query.product_id;
  const sortMethod = req.query.sort || 'relevance'; // default relevance
  const page = req.query.page || 1; // default 1
  const count = req.query.count || 5; // default 5
  let reviews = [];
  let length = 0;
  db.findByProductId(id, sortMethod, page, count) // sortoption
    .then((resp) => {
      reviews = resp;
      length = resp.length;
      const ops = [];
      for (let i = 0; i < resp.length; i++) {
        const isoDate = new Date(parseInt(reviews[i].date));
        reviews[i].date = isoDate;
        if (reviews[i].response === "null") {
          reviews[i].response = null;
        }
        // ops.push(db.getPhotoUrlArray(resp[i].id));
      }
      // return Promise.all(ops);
      const returnObj = {
        product: id,
        page,
        count: (length < count) ? length : count,
        results: reviews,
      };
      res.send(returnObj);
    })
    // .then((arrays) => {
    //   arrays.forEach((array, i) => {
    //     reviews[i].photos = array;
    //   });
    // })
    // .then(() => {
    //   const returnObj = {
    //     product: id,
    //     page,
    //     count: (length < count) ? length : count,
    //     results: reviews,
    //   };
    //   res.send(returnObj);
    // });
});

app.get('/reviews/meta', (req, res) => {
  const id = req.query.product_id;
  const returnObj = {
    product_id: id,
    ratings: {},
    recommended: { true: 0, false: 0 },
    characteristics: {},
  };

  const reviewIds = [];
  db.getMetaInfo(id)
    .then((reviews) => {
      reviews.forEach((review) => {
        !returnObj.ratings[review.rating]
          ? returnObj.ratings[review.rating] = 1
          : returnObj.ratings[review.rating]++;
        review.recommend
          ? returnObj.recommended.true++
          : returnObj.recommended.false++;
        reviewIds.push(review.id);
      });
      reviews[0].characteristics.forEach((char) => {
        returnObj.characteristics[`${char.name}`] = { id: char.id };
      });
      const charsObj = {};
      reviews.forEach(review => {
        review.char_reviews.forEach((char_review) => {
          const charId = char_review.characteristic_id;
          !charsObj[charId]
            ? charsObj[charId] = char_review.value
            : charsObj[charId] += char_review.value;
        })
      })
      for (const key in charsObj) {
        const temp = charsObj[key];
        charsObj[key] = parseFloat(temp) / reviewIds.length;
        for (const name in returnObj.characteristics) {
          const charId = `${returnObj.characteristics[name].id}`;
          if (charId === key) {
            // console.log('match!');
            returnObj.characteristics[name].value = charsObj[key];
            break;
          }
        }
      }
    })
    .then(() => res.send(returnObj));
    //     .then(() => {
    //       const ops = [];
    //       reviewIds.forEach((id) => {
    //         ops.push(db.findCharsByReview(id)); // find in char_reviews with each review id
    //       });
    //       return Promise.all(ops); //
    //     })
    //     .then((charsOfReviews) => { // an array of char reviews with ratings of each char
    //       const charsObj = {};
    //       charsOfReviews.forEach((charsOfReview) => {
    //         charsOfReview.forEach((char) => {
    //           const charId = char.characteristic_id;
    //           !charsObj[charId]
    //             ? charsObj[charId] = char.value
    //             : charsObj[charId] += char.value;
    //         });
    //       });
    //       for (const key in charsObj) {
    //         const temp = charsObj[key];
    //         charsObj[key] = parseFloat(temp) / reviewIds.length;
    //         for (const name in returnObj.characteristics) {
    //           const charId = `${returnObj.characteristics[name].id}`;
    //           if (charId === key) {
    //             // console.log('match!');
    //             returnObj.characteristics[name].value = charsObj[key];
    //             break;
    //           }
    //         }
    //       }
    //     })
    //     .then(() => res.send(returnObj))
    // .catch((err) => res.send(err));
  // res.send('hello');
});

// add review
app.post('/reviews', (req, res) => {
  const reviewForm = req.body;
  const chars = reviewForm.characteristics;
  let photoUrls = [];
  if (reviewForm.photos) {
    photoUrls = reviewForm.photos;
    delete reviewForm.photos;
  }
  delete reviewForm.characteristics;
  reviewForm.helpfulness = 0;
  reviewForm.reported = false;
  reviewForm.reviewer_email = reviewForm.email;
  reviewForm.reviewer_name = reviewForm.name;
  reviewForm.date = (`${new Date().getTime()}`);
  let lastPhotoId = 0;
  let lastCharReviewId = 0;
  let charsOfProduct = [];
  db.getLast('photo')
    .then((photo) => { lastPhotoId = photo[0].id; });
  db.getLast('char')
    .then((char) => { lastCharId = char[0].id; });
  db.getLast('charreview')
    .then((charRev) => { lastCharReviewId = charRev[0].id; });
  db.getLast('review')
    .then((review) => {
      charsOfProduct = review[0].chars;
      console.log(review.chars);
      reviewForm.id = review[0].id + 1;
      db.create('review', reviewForm)
        .then(() => {
          console.log('success adding review');
        })
        .catch((err) => console.log(err, 'error adding'))
        .then(() => {
          const photoObjs = [];
          photoUrls.forEach((url, i) => {
            const obj = { id: lastPhotoId + 1 + i, review_id: reviewForm.id, url };
            photoObjs.push(obj);
          });
          db.create('photo', photoObjs)
            .then(() => console.log('success adding photos'))
            .catch((err) => console.log(err, 'error adding photos'))
            .then(() => { // onto characteristic reviews
              const charRevObjs = [];
              const charRatings = Object.values(chars);
              const charIds = [];
              charsOfProduct.forEach((char) => charIds.push(char.id));
              charRatings.forEach((rating, i) => {
                const obj = {
                  id: lastCharReviewId + 1 + i,
                  review_id: reviewForm.id,
                  value: rating,
                  characteristic_id: parseInt(charIds[i]),
                };
                charRevObjs.push(obj);
              });
              db.create('charreview', charRevObjs)
                .then(() => console.log('success adding charreviews'))
                .catch((err) => console.log(err, 'error adding charreviews'))
                .then(() => res.send('review added to database'));
            });
        });
    });
});

// mark as helpful
app.put('/reviews/:review_id/helpful', (req, res) => {
  const id = req.params.review_id.slice(1);
  db.markHelpful(id)
    .then((response) => console.log(response, 'success marking helpful'))
    .catch((err) => console.log('error marking helpful', err));
  res.send('success');
});

// report review
app.put('/reviews/:review_id/report', (req, res) => {
  const id = req.params.review_id.slice(1);
  db.report(id)
    .then((response) => console.log(response, 'success reporting review'))
    .catch((err) => console.log('error reporting', err));
  res.send('success reporting');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server listening at http://localhost:${PORT}`));
