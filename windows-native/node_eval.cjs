// Deliberately unsandboxed native Node execution for the Windows distribution.
// Agent Zero already warns that native mode gives the model host access.
"use strict";

const source = process.argv[2] || "";
if (!source) process.exit(0);

(async () => {
  // This is an execution surface, not a security boundary. The Electron app
  // keeps the renderer sandboxed, while this child intentionally does not.
  const value = await eval(`(async () => {\n${source}\n})()`);
  if (value !== undefined) {
    if (typeof value === "string") {
      process.stdout.write(value + "\n");
    } else {
      process.stdout.write(JSON.stringify(value) + "\n");
    }
  }
})().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
