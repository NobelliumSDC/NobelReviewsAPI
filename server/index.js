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



const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`Server listening at http://localhost:${PORT}`)
);
