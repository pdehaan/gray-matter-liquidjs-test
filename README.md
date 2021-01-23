# gray-matter-liquidjs-test

> Building a basic blog w/ [LiquidJS](http://npm.im/liquidjs) and [gray-matter](http://npm.im/gray-matter).

Welcome to the world's worst static site generator<sup>tm</sup>.

**WARNING:** This could be full of bugs and there is very few guardrails or safety/quality checks. I'll do my best to call out any pitfalls or expected issues below.

## Getting Started

If you haven't been suitably scared off by the WARNING above, here we go...

### index.js

This is where the bulk of the configuration and setup lives. First we have a few `require()` statements for some custom LiquidJS filters. By default it should process all tweets in the ./_data/tweets.json file, but if you're just doing local development, you might only want to process a handful of tweets at a time to reduce build times. Note that on L3 we have `const tweets = require("./_data/tweets")();`. If you only want to process 15 tweets (vs 56571), you can either pass a number in the arguments (ie: `require("./_data/tweets")(15)`), or you can set `LIMIT` environment variable (ie: <kbd>LIMIT=15 npm start</kbd>).

By default the site will be written to a `./_site/` directory (in an effort to have some compatibility w/ 11ty). You can override this by setting the `engine.outputDir` variable, as seen on L9.

Next we add a few helper filters to LiquidJS:
- `autoLink` &mdash; A wrapper for [twitter-text](https://www.npmjs.com/package/twitter-text). The library provides autolinking and extraction for URLs, usernames, lists, and hashtags.
- `numberFormat` &mdash; A weak number formatter which will format Number values using `.toLocaleString()` so it adds commas and makes numbers easier to read (at the expense of making the numbers localized to a generally North American standard).
- `stringify` &mdash; Wrapper for `JSON.stringify()` and outputs nice JSON blobs in our LiquidJS templates when we write data.json files.

Next we use `await engine.parseFile(...)` to render a few LiquidJS templates, notably "./views/index.liquid", and "./views/404.liquid". These are just dummy placeholder templates and not very complex. We'll look at those shortly.

Finally, we loop over the `tweets` array using a `for..of` loop (easier to use w/ async functions than a `.forEach()`, IMO). For each of the tweets we'll render the "./views/tweet.liquid", "./views/tweetData.liquid", and "./views/tweetEmbed.liquid" files and pass in the current `tweet` object as a local variable.

So far, so good.

### views/index.liquid

This is our first liquid template. You can see that it has some front-matter for:
- `title` &mdash; This will be used for the `<title>` tag in the `<head>`.
- `layout` &mdash; Which layout file to use in ./views/ directory. In this case it will be "./views/layouts/base.liquid".
- `permalink` &mdash; Where to write the output file to. This will remap the filename to "home.html". I probably should have reversed these to say "home.liquid" and it outputs to "index.html".

After the front-matter, we have the template content, the actual liquid template we want to render. We wrap it in a `{% block content %}` block so the base layout knows where to put the content within its template. Other fun includes using the `{{ title }}` variable from the current page's frontmatter, and using the `{{ pkg.author }}` variable from our global variables (which maps to our package.json file; similar to how 11ty does a thing).

### views/404.liquid

This is boring, and the same as views/index.liquid. Moving on...

### views/tweet.liquid

One of our first real interesting templates, this uses a dyanamic permalink with the current `{{ tweet.id }}` value. Unlike 11ty, you need to use full file paths for output files in the permalinks. I'm not doing any checking or validating or assuming you want "index.html".

Similar to the other liquid templates, we wrap everything in a `{% block content %}...{% endblock %}` wrapper. This is also the first time we [render a partial](https://liquidjs.com/tags/render.html) using the `{% render "tweet-card", tweet: tweet %}` tag. Basically we're including the ./views/tweet-card.liquid partial and passing the local `tweet` variable into the partial file.

### views/tweetEmbed.liquid

Also boring and too similar to views/tweet.liquid to bother mentioning. Next!

### views/tweet-card.liquid

Before moving on, let's look at the tweet-card.liquid partial. Nothing too interesting here, it's just an include file. No front-matter included, only some basic HTML markup and our variables. We wrap the `{{ tweet.text }}` in a `<blockquote>` tag, and add some `data-*` attributes. No real reason, but it may make styling them via CSS easier if you want to somehow display retweets, deleted, or flagged tweets different from vanilla tweets.

This is also the first time we see our custom filters in action! Here we see the `autoLink` filter which will auto link @-references and hashtags. It doesn't unminify t.co links, so those are still annoyingly shortened and it's like playing link-roulette. We also use the liquid built-in `newline_to_br` filter which will convert newlines to `<br>` tags since some tweets seemingly have linebreaks.

We also see the use of the `numberFormat` filter for `retweets` and `favorites` so they get commas and whatever.

Finally we use the built-in `capitalize` filter which will convert our Boolean `true` to `True`. No real reason why, but it's fun to experiment.

### views/tweetData.liquid

A template so short we can inline it here:

```liquid
---
permalink: "tweets/{{ tweet.id }}/data.json"
---

{{ tweet | stringify }}
```

Here we use the `permalink` front-matter again to set our output file to a plain JSON file.

And our content is simply `{{ tweet | stringify }}` so the string gets `JSON.stringify()`ed instead of rendered as "[object Object]", which is beyond useless here.

Note that we don't use any custom `layout` or `{% block %}` stuff here. We simply want to render JSON.

### views/layouts/base.liquid

```liquid
  <main>
    {% block content %}
    {% endblock %}
  </main>
```

The main thing here is we define a few blocks for content and other stuff. So when we specify the "layouts/base" layout in the other templates front-matter, it knows where to position that generated content in its parent template.

### ./_data/.globals.js

This is where we can specify global variables that will be passed to the `new Liquid()` constructor in ./lib.js#12-14. These variables will be available to all layout templates without needing to pass them as local variables. So here you can see that we're currently loading the ./package.json file and passing those contents in as the `pkg` property so they're available globally. We saw this used earlier in views/index.liquid when we displayed the package.json's `author` property as `pkg.author`.

### ./_data/tweets.json

Big, old, unmanageable 16MB mess of JSON blob. Hard to read and filter and slice.

### ./_data/tweets.js

Wrapper for the ./_data/tweets.json file, as you can see that we `require()` that file on L1. We export a function here with a single parameter of `limit` which defaults to `process.env.LIMIT` if you want to only parse the first _n_ records in tweets.json. We also use `.map()` here to convert the `isFlagged: "f"` stuff into `isFlagged: false`, which is a better pattern.

Finally we have a `.slice()` method which will filter out the specified size limit of records, or default to return all tweets if no limit was specified.

### lib.js

Last but not least, this is the engine that runs it all. This is where the bugs will most likely lie. It manages template loading and caching, front-matter parsing, writing of output files, and everything inbetween. 94 lines of code, but a handful of that is basic JSDoc comments for cheap data types in VSCode.
