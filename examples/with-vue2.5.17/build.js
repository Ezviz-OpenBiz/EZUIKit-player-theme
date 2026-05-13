const webpack = require("webpack");
const config = require("./webpack.config.js");

webpack(config, (err, stats) => {
  if (err) {
    console.error(err);
    process.exit(1);
    return;
  }

  const info = stats.toJson();
  if (stats.hasErrors()) {
    console.error(info.errors);
    process.exit(1);
    return;
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }

  console.log(
    stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    })
  );

  process.exit(0);
});
