const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(
    "Please install Node.js 24 LTS (minimum supported: 22.13) and reopen your terminal.",
  );
  process.exit(1);
}
console.log(`Node.js ${process.versions.node} is supported.`);
