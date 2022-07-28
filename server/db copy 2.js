require("dotenv").config();
const {MongoClient} = require('mongodb');
async function main(){
  /**
   * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
   * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
   */
  // const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/test?retryWrites=true&w=majority";
  const uri = `mongodb://127.0.0.1:27017/${process.env.DB_NAME}`

  const client = new MongoClient(uri);

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      // Make the appropriate DB calls
      await  listDatabases(client);
      await findReview(client, 5);

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

main().catch(console.error);

async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();

  console.log('databases:');
  databasesList.databases.forEach(db => {
    console.log(`- ${db.name}`);
  })
}

async function findReview(client, reviewId) {
  const cursor = await client.db('nobelreviews').collection('reviews_photos')
    .find(
      {review_id: reviewId}
    );
  const photosWithReviewId = await cursor.toArray();

  console.log('urls of photos for that review:');
  photosWithReviewId.forEach(photo => {
    console.log(`- ${photo.url}`);
  })

  const review = await client.db('nobelreviews').collection('reviews')
    .findOne({id: reviewId});

    console.log('this review has reviewid 5', review.summary);
}

async function transform(client, )

async function photosIntoReviews(client) {
  //for each review
}