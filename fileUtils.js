const fs = require("fs");

function readDirectory(directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        reject(err);
      }
      resolve(files);
    });
  });
}

function removeFile(file) {
  return new Promise(resolve => {
    fs.unlink(file, err => {
      if (err) {
        console.log("FILE UNLINK ERROR: ", err);
      }
      console.log("File:", file, " removed.");
      resolve();
    });
  });
}

function saveFile(file, fileName) {
  const stream = fs.createWriteStream(fileName);
  stream.write(file);
}

module.exports = {
  readDirectory,
  saveFile,
  removeFile
};
