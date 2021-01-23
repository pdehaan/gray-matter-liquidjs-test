const twttr = require("twitter-text");

const tweets = require("./_data/tweets")();
const engine = require("./lib");

main();

async function main() {
  engine.outputDir = "www";

  engine.registerFilter("autoLink", twttr.autoLink);
  engine.registerFilter("numberFormat", (value, locale = "en-US") =>
    Number(value).toLocaleString(locale)
  );
  engine.registerFilter("stringify", (data) => JSON.stringify(data, null, 2));

  await engine.parseFile("./views/index.liquid");
  await engine.parseFile("./views/404.liquid");

  for (const tweet of tweets) {
    await engine.parseFile("./views/tweet.liquid", { tweet });
    await engine.parseFile("./views/tweetData.liquid", { tweet });
    await engine.parseFile("./views/tweetEmbed.liquid", { tweet });
  }
}
