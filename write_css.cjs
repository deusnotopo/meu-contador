const fs = require("fs");
const path = require("path");

const cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 240 10% 2%;
  --foreground: 0 0% 98%;
  --card: 240 10% 4%;
  --card-foreground: 0 0% 98%;
  --primary: 250 100% 65%;
  --primary-foreground: 0 0% 100%;
}

body {
  background-color: black;
  color: white;
}`;

const stylePath = path.join(__dirname, "src", "style.css");
fs.writeFileSync(stylePath, cssContent, { encoding: "utf8" });
console.log("Wrote style.css successfully");
