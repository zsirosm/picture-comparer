const fs = require("fs");
const os = require("os");
const { fork } = require("child_process");

const { readDirectory, saveFile, removeFile } = require("./fileUtils");

const { SEND_BASE_DIRECTORY, SEND_COMPARE_IMAGE } = require("./processEvents");

const threads = os.cpus().length;

function* fileGenerator(fileList) {
  let index = 0;
  while (fileList[index]) {
    yield fileList[index];
    index++;
  }
  return;
}

function processListener(
  process,
  fileGenerator,
  compareDirectory,
  duplicates,
  exclusives,
  resolveParent
) {
  // listener itself
  return data => {
    const { message, result } = data;
    // first message should be saved data
    if (message === "saved") {
      console.log("process seeded");
    } else if (message === "compared") {
      if (!result.matched) {
        exclusives.write("  " + result.image + "\n");
      } else {
        duplicates.write(
          "  " + result.image + " with " + result.matchedImage + "\n"
        );
      }
    }
    // whatever happens, send next file into thread if exists, if doesnt end execution
    const { value: fileName, done } = fileGenerator.next();
    console.log("picking up next file", fileName);
    if (fileName && !done) {
      process.send({
        action: SEND_COMPARE_IMAGE,
        compareFile: `${compareDirectory}/${fileName}`
      });
    } else {
      resolveParent();
    }
  };
}

async function compareThread({
  fileGenerator,
  compareDirectory,
  baseFiles,
  baseDirectory,
  duplicates,
  exclusives
}) {
  return new Promise(async resolve => {
    // fork another process
    const process = fork("./forkedProcess.js");
    // initial data seeding
    process.send({
      action: SEND_BASE_DIRECTORY,
      baseDirectory,
      baseFiles,
      compareDirectory
    });
    process.on(
      "message",
      processListener(
        process,
        fileGenerator,
        compareDirectory,
        duplicates,
        exclusives,
        resolve
      )
    );
  });
}

async function multiThreadedCompare(
  {
    fileGenerator,
    compareDirectory,
    baseFiles,
    baseDirectory,
    duplicates,
    exclusives
  },
  threadCount = 1
) {
  const threads = [];
  for (let i = 0; i < threadCount; i++) {
    threads.push(
      compareThread({
        fileGenerator,
        compareDirectory,
        baseFiles,
        baseDirectory,
        duplicates,
        exclusives
      })
    );
  }
  return Promise.all(threads);
}

async function searchForDuplicates(baseDirectory, compareDirectory) {

  

  const baseFiles = await readDirectory(baseDirectory);
  const compareFiles = await readDirectory(compareDirectory);

  const duplicates = fs.createWriteStream("duplicates.txt", {
    flags: "w",
    encoding: "utf8",
    fd: null,
    autoClose: true
  });
  const exclusives = fs.createWriteStream("exclusives.txt", {
    flags: "w",
    encoding: "utf8",
    fd: null,
    autoClose: true
  });
  duplicates.write("Duplicate files in " + compareDirectory + " folder:\n\n");
  exclusives.write("Exclusive files in " + compareDirectory + " folder:\n\n");

  console.log("concurrency", threads);

  const generator = fileGenerator(compareFiles);
  await multiThreadedCompare(
    {
      fileGenerator: generator,
      compareDirectory,
      baseFiles,
      baseDirectory,
      duplicates,
      exclusives
    },
    threads // number of threads
  );
  console.log("job done");
}

// ======================================

// console.log("yolo");

// const dir1 = process.argv[2];
// const dir2 = process.argv[3];

// // compareFiles("original.jpg", "sample.jpg").then(result => {
// //   console.log("rembrandt result", result);
// //   saveFile(result.compositionImage, "singleCompare.jpg")
// // });

// if (!(dir1 && dir2)) {
//   console.log("not enough directories for operation, exiting...");
//   process.exit(1);
// }

// searchForDuplicates(dir1, dir2);

module.exports = {
  searchForDuplicates
};
