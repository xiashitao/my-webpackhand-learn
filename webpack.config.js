const path = require("path");

module.exports = {
  context: process.cwd(), // 当前工作目录
  mode: "development",
  devtool: false,
  //   entry: "./src/index.js",
  entry: {
    page1: "./src/index.js",
    page2: "./src/index2.js",
    page3: "./src/index3.js",
  },
  output: {
    clean: true,
  },
  //   output: {
  //     path: path.resolve(__dirname, "dist"),
  //     filename: "main.js",
  //   },
  optimization: {
    splitChunks: {
      // 要分割哪些代码块， initial 是同步， require import '..xxx', async 是异步,import(), all 是同步 + 异步
      chunks: "all",
      minSize: 0,
      //   name: true,
      //   automaticNameDelimiter: "-",
      // 缓存组 设置不同的缓存组来抽取满足不同规则的chunk
      cacheGroups: {
        // 第三方
        previder: {
          // 把符合条件的缓存组提取出来放在vendors这个代码块中
          //   chunks: "all",
          test: /[\\/]node_modules[\\/]/, // 条件
        },
        // 提取不同代码块之间的公共代码
        commons: {
          // chunks: "all"
          minChunks: 2, // 如果这个模块被两个或者两个以上的代码块引用了，就可以单独提取出来
          minSize: 0, // 被提供的代码的大小， 默认是30kb
        },
      },
    },
  },
};
