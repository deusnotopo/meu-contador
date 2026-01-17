import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, "src");

console.log("Building minimal...");

try {
  await esbuild.build({
    entryPoints: [path.join(SRC_DIR, "main.tsx")],
    bundle: true,
    minify: false, // Turn off minify to see errors better
    outfile: path.join(__dirname, "dist", "index.js"),
    platform: "browser",
    format: "esm",
    loader: {
      ".tsx": "tsx",
      ".ts": "ts",
      ".js": "js",
      ".png": "file",
      ".jpg": "file",
      ".svg": "file",
      ".woff": "file",
      ".woff2": "file",
    },
    plugins: [
      {
        name: "alias-resolver",
        setup(build) {
          build.onResolve({ filter: /^@\// }, (args) => {
            const basePath = path.join(SRC_DIR, args.path.substring(2));
            const extensions = [
              ".tsx",
              ".ts",
              ".js",
              ".jsx",
              "/index.tsx",
              "/index.ts",
              "/index.js",
              "",
            ];
            for (const ext of extensions) {
              const fullPath = basePath + ext;
              if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                return { path: fullPath };
              }
            }
            return { path: basePath };
          });
        },
      },
      {
        name: "ignore-css",
        setup(build) {
          build.onResolve({ filter: /\.css$/ }, (args) => ({
            path: args.path,
            namespace: "ignore-css",
          }));
          build.onLoad({ filter: /.*/, namespace: "ignore-css" }, () => ({
            contents: "",
          }));
        },
      },
    ],
  });
  console.log("✅ Success");
} catch (e) {
  console.error(e);
  process.exit(1);
}
