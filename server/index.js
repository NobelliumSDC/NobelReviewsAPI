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
      console.log('success getting reviews by productId')
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
    .then((values) => {
      values.forEach((value, i) => {
        reviews[i].photos = value;
      })
    })
    .then(() => res.send(reviews));

});


app.get('/reviews/meta', (req, res) => {
  const id = req.query.product_id;
  let returnObj = {
    product_id: id,
    ratings: {},
    recommended: {},
    characteristics: {},
  }
  res.send(returnObj);
})

//add review
app.post('/reviews', (req, res) => {
  //should post to
  res.send('should add review to database');
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
