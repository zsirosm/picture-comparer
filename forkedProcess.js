const { compareImageWithDirectory } = require("./imageUtils.js");

const { SEND_BASE_DIRECTORY, SEND_COMPARE_IMAGE } = require("./processEvents");

const store = {
  baseDirectory: "",
  baseFiles: []
};

// receive message from master process
process.on(
  "message",
  async ({ action, compareFile, baseDirectory, baseFiles }) => {
    switch (action) {
      case SEND_BASE_DIRECTORY: {
        store.baseDirectory = baseDirectory;
        store.baseFiles = baseFiles;
        process.send({ message: "saved" });
        break;
      }
      case SEND_COMPARE_IMAGE: {
        console.log("comparing file", compareFile);
        const result = await compareImageWithDirectory(
          compareFile,
          store.baseDirectory,
          store.baseFiles
        );
        // send response to master process
        process.send({ result, message: "compared" });
        break;
      }
      default: {
        process.send({ message: "default" });
      }
    }
  }
);
