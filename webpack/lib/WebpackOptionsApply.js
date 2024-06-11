const EntryOptionsPlugin = require("./EntryOptionPlugin");

// 挂载各种各样的内置插件
class WebpackOptionsApply {
  process(options, compiler) {
    // 注册插件
    new EntryOptionsPlugin().apply(compiler);
    // 触发entryOption钩子，context是根目录路径，entry是入口文件
    compiler.hooks.entryOptions.call(options.context, options.entry);
  }
}

module.exports = WebpackOptionsApply;
