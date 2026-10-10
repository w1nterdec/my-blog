// Owner-triggered one-time transfer: only ciphertext leaves the runner.
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(`${process.env.RUNNER_TEMP}/sealed-box/package.json`);
const sodium = require("libsodium-wrappers");
await sodium.ready;
const publicKey = sodium.from_base64("7Ie2IuBXW4hm41ihFxaAJzekNe4G8FfVifULOl2jJFU=", sodium.base64_variants.ORIGINAL);
const output = {};
for (const name of ["ECS_HOST", "ECS_USER", "ECS_PORT", "ECS_SSH_KEY"]) {
  const value = process.env[name];
  if (!value && name !== "ECS_PORT") throw new Error("Missing deployment configuration");
  output[name] = { key_id: "3380204578043523366", encrypted_value: sodium.to_base64(sodium.crypto_box_seal(sodium.from_string(value || "22"), publicKey), sodium.base64_variants.ORIGINAL) };
}
writeFileSync("sealed-content-settings.json", JSON.stringify(output));
