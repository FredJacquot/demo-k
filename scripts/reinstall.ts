import { execSync } from "child_process";

console.log("[v0] Running npm install to regenerate package-lock.json...");
execSync("npm install", { cwd: "/vercel/share/v0-project", stdio: "inherit" });
console.log("[v0] npm install complete.");
