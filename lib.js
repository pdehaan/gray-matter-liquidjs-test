const fs = require("fs/promises");
const path = require("path");

const matter = require("gray-matter");
const { Liquid } = require("liquidjs");

const _globals = require("./_data/.globals");

const engine = new Liquid({
  extname: ".liquid",
  root: path.resolve(__dirname, "views"),
  globals: {
    ..._globals,
  },
});

const tmplCache = new Map();

module.exports = {
  outputDir: "_site",

  /**
   * Custom LiquidJS filter.
   * @see https://liquidjs.com/tutorials/register-filters-tags.html
   * @param {string} name
   * @param {function} fn
   */
  registerFilter(name, fn = () => {}) {
    return engine.registerFilter(name, fn);
  },

  /**
   * @param {string} filepath Path to the file to load (with frontmatter).
   * @param {object} [locals] Local variables to pass to the LiquidJS renderer.
   */
  async parseFile(filepath = "", locals = {}) {
    const page = await getTemplate(filepath);
    page.data = Object.assign({}, locals, page.data);
    page.data.permalink = await engine.parseAndRender(
      page.data.permalink,
      page.data
    );
    if (page.data.layout) {
      page.content = `
        {% layout "${page.data.layout}" %}
        ${page.content}
      `;
    }
    page.content = await engine.parseAndRender(page.content, page.data);
    page.outputPath = path.join(this.outputDir, page.data.permalink);
    await writeFile(page.outputPath, page.content);
    return page;
  },
};

/**
 * @typedef {Object} Template
 * @property {string} content The template's content.
 * @property {Object} data The template's front-matter data.
 * @property {boolean} isEmpty `true` if front-matter is empty.
 */

/**
 * @param {path} filepath Path to the LiquidJS template to load.
 * @returns {Template} A cached version of the specified template, which has been parsed for front-matter and content.
 */
async function getTemplate(filepath = "") {
  // TODO: Should this actually parse the template w/ gray-matter? Or just return
  // the raw template and let the caller do the parsing? Might remove the need to
  // destructure the return object to avoid loop cross-contamination.
  let page;
  if (tmplCache.has(filepath)) {
    page = tmplCache.get(filepath);
  } else {
    const tmpl = await fs.readFile(filepath, "utf-8");
    page = matter(tmpl);
    tmplCache.set(filepath, page);
  }

  delete page.excerpt;
  return { ...page };
}

/**
 *
 * @param {string} outputPath File name and path to output the template's content.
 * @param {string} content Content
 */
async function writeFile(outputPath = "", content = "") {
  const $outputPath = path.join(__dirname, outputPath);
  const outputDir = path.dirname($outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, content.trim());
}
