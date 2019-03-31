const presets = [
  ["@babel/react"],
  [
    "@babel/env",
    {
      targets: {
        chrome: "69"
      },
      modules: "umd"
    }
  ]
];

const plugins = [["@babel/plugin-proposal-class-properties"]];
module.exports = { presets, plugins };
