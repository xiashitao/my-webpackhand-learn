const webpack = require("./webpack");
const webpackOptions = require("./webpack.config.js");
debugger;

const compiler = webpack(webpackOptions);

compiler.run((err, stats) => {
  console.log(err);
  console.log(
    stats.toJson({
      entries: true,
      chunks: true,
      modules: true,
      _modules: true,
      assets: true,
    })
  );
});
