let fs = require("fs");

class NodeEnvironmentPlugin {
  constructor(options) {
    this.options = options || {};
  }

  apply(compiler) {
    compiler.inputFileSystem = fs; // 读模块
    compiler.outputFileSystem = fs; // 写模块 fs.writeFile
  }
}

module.exports = NodeEnvironmentPlugin;
