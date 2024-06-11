const Compiler = require("./Compiler");
const WebpackOptionsApply = require("./WebpackOptionsApply");
const NodeEnvironmentPlugin = require("./node/NodeEnvironmentPlugin");
const webpack = (options, callback) => {
  let compiler = new Compiler(options.context);
  compiler.options = options;
  new NodeEnvironmentPlugin().apply(compiler); // compiler 可以读文件和写文件
  // 挂在配置文件中所有的plugin
  if (options.plugins && Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      plugin.apply(compiler);
    }
  }

  // 初始化选项，挂载内置插件

  new WebpackOptionsApply().process(options, compiler);
  return compiler;
};

exports = module.exports = webpack;
