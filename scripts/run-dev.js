#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.join(__dirname, "..");

const projects = [
  { name: "backend", dir: path.join(rootDir, "cool-bordados"), cmd: "npm", args: ["run", "dev"] },
  { name: "frontend", dir: path.join(rootDir, "cool-bordados-storefront"), cmd: "npm", args: ["run", "dev"] },
];

function startProcess({ name, dir, cmd, args }) {
  console.log(`[${name}] Iniciando en ${dir}: ${cmd} ${args.join(" ")}`);

  const child = spawn(cmd, args, {
    cwd: dir,
    shell: true,
    env: process.env,
  });

  child.stdout.on("data", (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[${name}] ${data}`));
  child.on("close", (code) => console.log(`[${name}] Proceso terminado con código ${code}`));

  return child;
}

const children = projects.map(startProcess);

function shutdown(signal) {
  console.log(`\nRecibido ${signal}. Deteniendo procesos...`);
  children.forEach((c) => {
    try {
      c.kill(signal);
    } catch (err) {
      // ignore
    }
  });
  setTimeout(() => process.exit(0), 500);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));