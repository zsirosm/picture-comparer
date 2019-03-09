const Rembrandt = require("rembrandt");
const sharp = require("sharp");

function loadImage(imagePath) {
  return sharp(imagePath);
}

async function returnImageDimensions(file, fileName) {
  return new Promise(async (resolve, reject) => {
    // console.log("got file", fileName);
    try {
      file.metadata().then(data => {
        // console.log("got metadata", fileName);
        resolve(data);
      });
    } catch (err) {
      console.log("error retrieving metadata", err);
      reject(err);
    }
  });
}

async function resizeImage(imageFile, width) {
  return imageFile.resize(width).toBuffer();
}

async function returnResizedFiles(file1, file2, fileName1, fileName2) {
  const [file1dimensions, file2dimensions] = await Promise.all([
    returnImageDimensions(file1, fileName1),
    returnImageDimensions(file2, fileName2)
  ]);
  // const file1dimensions = await returnImageDimensions(file1, fileName1);
  // const file2dimensions = await returnImageDimensions(file2, fileName2);
  if (file1dimensions.width !== file2dimensions.width) {
    return file1dimensions.width >= file2dimensions.width
      ? Promise.all([
          resizeImage(file1, file2dimensions.width),
          file2.toBuffer()
        ])
      : Promise.all([
          file1.toBuffer(),
          resizeImage(file2, file1dimensions.width)
        ]);
  }
  return Promise.all([file1.toBuffer(), file2.toBuffer()]);
}

async function compareFiles(file1, file2) {
  try {
    const [imageFile1, imageFile2] = await Promise.all([
      loadImage(file1),
      loadImage(file2)
    ]);
    const [imageA, imageB] = await returnResizedFiles(
      imageFile1,
      imageFile2,
      file1,
      file2
    );
    const rembrandt = new Rembrandt({
      imageA,
      imageB,
      thresholdType: Rembrandt.THRESHOLD_PERCENT,
      maxThreshold: 0.1,
      maxDelta: 0.01,
      maxOffset: 0,
      renderComposition: true, // Should Rembrandt render a composition image?
      compositionMaskColor: Rembrandt.Color.RED // Color of unmatched pixels
    });
    return rembrandt.compare();
  } catch (e) {
    console.log("error happened", e);
    return Promise.reject(e);
  }
}

async function linearlyCompareImage(image, directory, imageList, index = 0) {
  if (index >= imageList.length) {
    return Promise.resolve({ image, matched: false });
  }
  // console.log("comparing", image, imageList[index]);
  const result = await compareFiles(image, `${directory}/${imageList[index]}`);
  if (result.passed) {
    return Promise.resolve({
      ...result,
      image,
      matchedImage: imageList[index],
      matched: true
    });
  }
  return linearlyCompareImage(image, directory, imageList, index + 1);
}

async function compareImageWithDirectory(image, directory, imageList) {
  return new Promise(async resolve => {
    const result = await linearlyCompareImage(image, directory, imageList);
    resolve(result);
  });
}

//   // Run the comparison

//     .then(function(result) {
//       console.log("Passed:", result.passed);
//       console.log(
//         "Pixel Difference:",
//         result.differences,
//         "Percentage Difference",
//         result.percentageDifference,
//         "%"
//       );
//       console.log("Composition image buffer:", result.compositionImage);
//       // Note that `compositionImage` is an Image when Rembrandt.js is run in the browser environment
//       const file = fs.createWriteStream("result.jpg");
//       file.write(result.compositionImage);
//     })
//     .catch(e => {
//       console.error(e);
//     });
// });

module.exports = {
  compareFiles,
  compareImageWithDirectory
};
