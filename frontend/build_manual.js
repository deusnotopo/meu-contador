import { exec } from "child_process";
import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "dist");
const PUBLIC_DIR = path.join(__dirname, "public");
const SRC_DIR = path.join(__dirname, "src");

async function build() {
  console.log("🚀 Starting Emergency Manual Build (CDN Fallback Mode V2)...");

  // 1. Clean & Create dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR);
  console.log("✅ Cleaned dist directory");

  // 2. Copy Public Assets
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.cpSync(PUBLIC_DIR, DIST_DIR, { recursive: true });
    console.log("✅ Copied public assets");
  }

  // 3. Build CSS with Tailwind
  console.log("🎨 Building Tailwind CSS...");
  await new Promise((resolve, reject) => {
    exec(
      "npx tailwindcss -i ./src/style.css -o ./dist/style.css --minify",
      (err, stdout, stderr) => {
        if (err) {
          console.error("❌ Tailwind build failed:", stderr);
          reject(err);
        } else {
          console.log("✅ Tailwind CSS built");
          resolve();
        }
      }
    );
  });

  // 4. Build JS with Esbuild
  console.log("⚡ Bundling Application with Esbuild...");
  try {
    await esbuild.build({
      entryPoints: [path.join(SRC_DIR, "main.tsx")],
      bundle: true,
      minify: true,
      outfile: path.join(DIST_DIR, "assets", "index.js"),
      platform: "browser",
      format: "esm",
      target: ["es2020"],
      external: ["goober", "react-hot-toast"], // <--- MARK BOTH AS EXTERNAL
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
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      jsx: "automatic",
    });
    console.log("✅ Application bundled successfully");
  } catch (e) {
    console.error("❌ Esbuild failed:", e);
    process.exit(1);
  }

  // 5. Process HTML
  console.log("📄 Processing index.html...");
  let html = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");

  // Inject Import Map for goober AND react-hot-toast
  const importMap = `
    <script type="importmap">
    {
        "imports": {
            "goober": "https://unpkg.com/goober@2.1.18/dist/goober.modern.js",
            "react-hot-toast": "https://unpkg.com/react-hot-toast@2.4.1/dist/index.mjs"
        }
    }
    </script>
    `;

  html = html.replace("<head>", "<head>\n" + importMap);

  // Replace script src
  html = html.replace(
    /<script type="module" src=".*main\.tsx"><\/script>/,
    '<script type="module" src="/assets/index.js"></script>'
  );

  // Ensure CSS link is correct
  if (!html.includes('href="/style.css"')) {
    html = html.replace(
      "</head>",
      '<link rel="stylesheet" href="/style.css">\n</head>'
    );
  }

  // Remove local Tailwind reference if exists
  html = html.replace('<link rel="stylesheet" href="/tailwind.css">', "");

  fs.writeFileSync(path.join(DIST_DIR, "index.html"), html);
  console.log("✅ index.html generated");

  console.log("\n🎉 BUILD COMPLETE! Ready to deploy.");
}

build();
