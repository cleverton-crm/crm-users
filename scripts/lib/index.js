"use strict";
const path = require("path");
const fs = require("fs");
const { cyan, red, green } = require("cli-color");

function log(opts, output) {
  if (opts.verbose) {
    process.stdout.write(output);
  }
}

function isCamelCase(str) {
  return !!str.match(/^[a-z]+[A-Z]/);
}

function camelToSnakeCase(str) {
  if (isCamelCase(str)) {
    return str.replace(/[A-Z]/g, "_$&");
  }
  return str;
}

function build(obj, key, writableStream, config) {
  let prefix, prefix2, prefix3;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v == "string" || typeof v == "number") {
      prefix = k.toUpperCase() + "_";
      console.log(green(prefix), v);
      backData(prefix, v, writableStream);
    } else if (typeof v == "object") {
      prefix = k.toUpperCase() + "_";
      backData(prefix, v, writableStream);
    }
  }
}

function backData(prefix, obj, writableStream) {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v == "string" || typeof v == "number") {
      let prefixNM = prefix + k.toUpperCase();
      let exportString = prefixNM + "=" + v + "\n";
      writableStream.write(exportString);
      console.log(cyan(exportString));
    } else {
      let prefixNM = prefix + k.toUpperCase() + "_";
      backData(prefixNM, v, writableStream);
    }
  }
}

module.exports = function buildEnv(config) {
  var inputFile = config.input;
  var outputFile = config.output;

  var optionKey = config.key ? config.key.value : null;

  if (!/\.json/.test(inputFile)) {
    return process.stdout.write("Requires json input file\n");
  }

  if (!outputFile) {
    return process.stdout.write("Requires output file\n");
  }

  var jsonFile = path.resolve(inputFile);
  var envFile = path.resolve(outputFile);
  log(config, "Input file: " + jsonFile + "\n");
  log(config, "Output file: " + envFile + "\n");

  // TODO: Validate json file first
  var json = require(jsonFile);

  var inputObj = optionKey ? json[optionKey] : json;

  var stream = fs.createWriteStream(envFile);

  build(inputObj, optionKey, stream, config);

  log(config, "Done\n");
  // TODO: Close fd
  return;
};
