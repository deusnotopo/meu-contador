const { build } = require("vite");
const react = require("@vitejs/plugin-react");

(async () => {
  try {
    await build({
      configFile: false,
      plugins: [react()],
      root: process.cwd(),
      build: { outDir: "dist-test" }
    });
    console.log("Build successful!");
  } catch (err) {
    console.error("BUILD FAILED:");
    console.error(err);
    if (err.id) console.error("ID:", err.id);
    if (err.loc) console.error("LOC:", err.loc);
    if (err.frame) console.error("FRAME:", err.frame);
  }
})();