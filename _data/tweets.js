const tweets = require("./tweets.json");

module.exports = (limit = process.env.LIMIT) => {
  return (
    tweets
      .map((tweet) => {
        // Tidy up the data to make filtering easier (but might break things if
        // you switch to looping over tweets.json directly since the fields are
        // out of sync).
        tweet.isFlagged = tweet.isFlagged !== "f";
        tweet.isDeleted = tweet.isDeleted !== "f";
        tweet.isRetweet = tweet.isRetweet !== "f";
        return tweet;
      })
      // .filter(tweet => tweet.isFlagged)
      .slice(0, Number(limit) || tweets.length)
  );
};
