const fs = require("fs");
const path = require("path");

const projectRoot = "D:\\meu-contador";

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

const AppCssContent = `body { margin: 0; padding: 0; }`;

fs.writeFileSync(
  path.join(projectRoot, "src", "style.css"),
  cssContent,
  "utf8"
);
fs.writeFileSync(
  path.join(projectRoot, "src", "App.css"),
  AppCssContent,
  "utf8"
);

console.log("Final stabilization complete.");
