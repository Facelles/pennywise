// Node-sass compatibility wrapper for modern sass package
// This wrapper translates the old node-sass API to the new sass API

const sass = require("sass");

// Convert old node-sass options to new sass options
function convertOptions(options) {
  const newOptions = {
    data: options.data,
    file: options.file,
    includePaths: options.includePaths || [],
    outputStyle: options.outputStyle || "nested",
    sourceMap: options.sourceMap,
    sourceMapContents: options.sourceMapContents,
    sourceMapEmbed: options.sourceMapEmbed,
    sourceMapRoot: options.sourceMapRoot,
    indentedSyntax: options.indentedSyntax,
  };

  // Handle deprecated precision option
  if (options.precision !== undefined) {
    console.warn(
      "node-sass precision option is deprecated and ignored in sass"
    );
  }

  return newOptions;
}

// Convert sass result to node-sass format
function convertResult(result) {
  return {
    css: result.css,
    map: result.map,
    stats: {
      entry: result.loadedUrls?.[0]?.pathname || "",
      start: Date.now(),
      end: Date.now(),
      duration: 0,
      includedFiles: result.loadedUrls?.map((url) => url.pathname) || [],
    },
  };
}

// Synchronous render function
function renderSync(options) {
  try {
    const convertedOptions = convertOptions(options);

    if (options.data) {
      const result = sass.compileString(options.data, {
        loadPaths: convertedOptions.includePaths,
        style: convertedOptions.outputStyle,
        sourceMap: convertedOptions.sourceMap,
        sourceMapIncludeSources: convertedOptions.sourceMapContents,
      });
      return convertResult(result);
    } else if (options.file) {
      const result = sass.compile(options.file, {
        loadPaths: convertedOptions.includePaths,
        style: convertedOptions.outputStyle,
        sourceMap: convertedOptions.sourceMap,
        sourceMapIncludeSources: convertedOptions.sourceMapContents,
      });
      return convertResult(result);
    } else {
      throw new Error("Either data or file option must be specified");
    }
  } catch (error) {
    // Convert sass error to node-sass format
    const nodesassError = new Error(error.message);
    nodesassError.status = 1;
    nodesassError.file = error.file || options.file;
    nodesassError.line = error.line;
    nodeassError.column = error.column;
    throw nodeassError;
  }
}

// Asynchronous render function
function render(options, callback) {
  try {
    const result = renderSync(options);
    if (callback) {
      setTimeout(() => callback(null, result), 0);
    }
    return result;
  } catch (error) {
    if (callback) {
      setTimeout(() => callback(error), 0);
    } else {
      throw error;
    }
  }
}

module.exports = {
  render,
  renderSync,
  // Additional exports for compatibility
  info: "node-sass compatibility wrapper for sass",
  types: {
    Boolean: "boolean",
    Color: "color",
    List: "list",
    Map: "map",
    Null: "null",
    Number: "number",
    String: "string",
  },
};
