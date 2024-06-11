class SingleEntryPlugin {
  constructor(context, entry, name) {
    this.context = context;
    this.entry = entry; // 入口模块路径
    this.name = name; // 入口的名字 name
  }

  apply(compiler) {
    compiler.hooks.make.tapAsync(
      "SingleEntryPlugin",
      (compilation, callback) => {
        const { context, entry, name } = this;
        // 从此入口开始编译，编译入口文件和他的依赖
        console.log("SingleEntryPlugin make");
        compilation.addEntry(context, entry, name, callback);
      }
    );
  }
}

module.exports = SingleEntryPlugin;
