import fs from "node:fs";
import path from "node:path";

const patchCode = `import * as _events from "node:events";
import * as _stream from "node:stream";
import * as _util from "node:util";
import * as _crypto from "node:crypto";
import * as _buffer from "node:buffer";
import * as _string_decoder from "node:string_decoder";
import * as _net from "node:net";
import * as _tls from "node:tls";
import * as _dns from "node:dns";
import * as _fs from "node:fs";
import * as _utilTypes from "node:util/types";

const __builtins = {
  events: _events,
  "node:events": _events,
  stream: _stream,
  "node:stream": _stream,
  util: _util,
  "node:util": _util,
  "util/types": _utilTypes,
  "node:util/types": _utilTypes,
  crypto: _crypto,
  "node:crypto": _crypto,
  buffer: _buffer,
  "node:buffer": _buffer,
  string_decoder: _string_decoder,
  "node:string_decoder": _string_decoder,
  net: _net,
  "node:net": _net,
  tls: _tls,
  "node:tls": _tls,
  dns: _dns,
  "node:dns": _dns,
  fs: _fs,
  "node:fs": _fs,
};

var require = function(id) {
  if (__builtins[id]) return __builtins[id];
  throw new Error('Calling require for "' + id + '" is not supported.');
};
`;

function findAndPatchFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findAndPatchFiles(fullPath);
    } else if (entry.isFile() && entry.name.startsWith("rolldown-runtime-") && entry.name.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes("createRequire as __cr")) {
        content = content.replace(/import\{createRequire as __cr\}from"node:module";var require=__cr\(import\.meta\.url\);/, "");
      }
      if (!content.includes("__builtins")) {
        console.log("Patching", fullPath);
        content = patchCode + content;
        fs.writeFileSync(fullPath, content);
      } else {
        console.log("Already patched", fullPath);
      }
    }
  }
}

findAndPatchFiles("dist/server");
console.log("Finished patching rolldown runtimes with built-in require map.");
