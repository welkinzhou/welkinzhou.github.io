const { copyFileSync } = require("node:fs");
const { join } = require("node:path");

// Existing RSS readers request these files directly, without running HTML
// redirects. Copy the new feeds after Docusaurus has finished generating them.
for (const feed of ["rss.xml", "atom.xml"]) {
  copyFileSync(join(__dirname, "..", "build", "blog", feed), join(__dirname, "..", "build", feed));
}
console.log("Preserved /rss.xml and /atom.xml for existing subscribers.");
