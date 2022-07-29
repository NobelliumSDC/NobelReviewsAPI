require("dotenv").config();
const express = require("express");
const path = require("path");
const controllers = require("./controllers.js");

const app = express();

app.use(express.static(path.join(__dirname, "../client/dist")));
app.use(express.json());
const db = require('./db.js');

app.get('/reviews', (req, res) => {
  const id = req.query.product_id;
  let reviews = [];
  db.findByProductId(id)
    .then((response) => {
      reviews = response
        .filter(review => !review.reported)
        .map(review => {
          review.photos=[];
          return review;
        })
      return reviews;
    })
    .then((value) => {
      let ops = [];
      for(let i = 0; i < value.length; i++) {
        ops.push(db.getPhotoUrlArray(reviews[i].id))
      }
      return Promise.all(ops)
    })
    .then((arrays) => {
      arrays.forEach((array, i) => {
        reviews[i].photos = array;
      })
    })
    .then(() => res.send(reviews));

});


app.get('/reviews/meta', (req, res) => {
  const id = req.query.product_id;
  let returnObj = {
    product_id: id,
    ratings: {},
    recommended: {true: 0, false: 0},
    characteristics: {},
  }
  let charObj = {};
  // db.findChar(id)
  //   .then((chars) => {
  //     chars.forEach(char => {
  //       console.log(char.name);
  //       returnObj.characteristics[char.name] = 0;
  //     })
  //   })
  let reviewIds = [];
  db.findByProductId(id)
    .then((reviews) => {
      reviews.forEach(review => {
        !returnObj.ratings[review.rating]
          ? returnObj.ratings[review.rating] = 1
          : returnObj.ratings[review.rating]++;
        review.recommend
          ? returnObj.recommended.true++
          : returnObj.recommended.false++;
        reviewIds.push(review.id);
      })
    })
    .then(() => {
      db.findChar(id)
      .then((chars) => {
        chars.forEach(char => {
          // returnObj.characteristics[`${char.name}`] = {};
          returnObj.characteristics[`${char.name}`] = {id:char.id};
        })
      })
      .then(() => {
        let ops = [];
        reviewIds.forEach(id => {
          ops.push(db.findCharsByReview(id));
        })
        return Promise.all(ops); //
      })
      .then((charsOfReviews) => {
        let charsObj = {}
        charsOfReviews.forEach((charsOfReview) => {
          charsOfReview.forEach((char) => {
            console.log(char);
            let charId = char.characteristic_id;
            !charsObj[charId]
              ? charsObj[charId] = char.value
              : charsObj[charId] += char.value;
          })
        })
        console.log(charsObj);
        for(let key in charsObj) {
          let temp = charsObj[key];
          charsObj[key] = temp/reviewIds.length;
          for(let name in returnObj.characteristics) {
            let charId = returnObj.characteristics[name].id + '';
            console.log(key);
            if(charId === key) {
              // console.log('match!');
              returnObj.characteristics[name]['value'] = charsObj[key];
              break;
            }
          }
        }
      })
      .then(() => res.send(returnObj));
    })
    .catch((err) => res.send(err));
})


const sample = {
  product_id: 5,
  rating: 1,
  summary: 'hello',
  body: 'what it do baby yao yoa',
  name: 'IU',
  email: 'tea@time.com',
  recommend: true,
  characteristics: {
    125031: 2,
    125032: 3,
    125033: 4,
    125034: 4,
  },
  photos: ['http://res.cloudinary.com/joehan/image/upload/v1658260875/b7xg9m7xthi6uzftq5me.jpg']
};

//add review
app.post('/reviews', (req, res) => {
  let reviewForm = req.body;
  let chars = reviewForm.characteristics;
  let photoUrls = [];

  if (reviewForm.photos) {
    console.log('photos exists!')
    photoUrls = reviewForm.photos;
    delete reviewForm.photos;
  }
  delete reviewForm.characteristics;
  reviewForm.helpfulness = 0;
  reviewForm.reported = false;
  reviewForm.reviewer_email = reviewForm.email;
  reviewForm.reviewer_name = reviewForm.name;
  reviewForm.date = (new Date().getTime()+ '');
  let lastPhotoId = 0;
  db.getLastPhoto()
    .then((photo) => lastPhotoId = photo[0].id)
    .then(() => console.log('this is the last photo id', lastPhotoId));
  db.getLastReview()
    .then((review) => {
      reviewForm.id = review[0].id + 1
      db.create(reviewForm)
        .then(() => {
          console.log('success adding review');

        })
        .catch((err) => console.log(err, 'error adding'))
        .then(() => {
          const photoObjs = [];
          photoUrls.forEach((url, i) => {
            let obj = {id: lastPhotoId + 1 + i, review_id: reviewForm.id, url: url};
            photoObjs.push(obj);
          })
          // console.log(photoObjs);
          db.createPhoto(photoObjs)
            .then(() => res.send('review added to database'))
        })
    })


  // TODO: needs to save characteristics to characteristics and reviews char
})

//mark as helpful
app.put('/reviews/:review_id/helpful', (req, res) => {
  const id = req.params.review_id.slice(1);
  db.markHelpful(id)
    .then((response) => console.log(response, 'success marking helpful'))
    .catch((err) => console.log('error marking helpful'))
  res.send('success');
})

//report review
app.put('/reviews/:review_id/report', (req, res) => {
  const id = req.params.review_id.slice(1);
  db.report(id)
    .then((response) => console.log(response, 'success reporting review'))
    .catch((err) => console.log('error reporting'))
  res.send('success reporting');
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`Server listening at http://localhost:${PORT}`)
);
