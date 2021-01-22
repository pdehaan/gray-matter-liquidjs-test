const tweets = require("./tweets.json");

module.exports = (limit=50) => tweets
  .map(tweet => {
    // Tidy up the data to make filtering easier.
    tweet.isFlagged = tweet.isFlagged !== "f";
    tweet.isDeleted = tweet.isDeleted !== "f";
    tweet.isRetweet = tweet.isRetweet !== "f";
    return tweet;
  })
  // .filter(tweet => tweet.isFlagged)
  .slice(0, limit);
