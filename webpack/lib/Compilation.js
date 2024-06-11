const { SyncHook } = require("tapable");

const NormalModuleFactory = require("./NormalModuleFactory");

const path = require("path");

const normalModuleFactory = new NormalModuleFactory();

const Parser = require("../Parser");
const parser = new Parser();

class Compilation {
  constructor(compiler) {
    this.compiler = compiler;
    this.options = compiler.options;
    this.context = compiler.context;
    this.inputFileSystem = compiler.inputFileSystem;
    this.outputFileSystem = compiler.outputFileSystem;
    this.entries = []; // 入口数组， 这里放着所有的入口模块
    this.modules = []; // 模块的数组，这里放着所有的模块
    this.hooks = {
      // 当你成功构建完成一个模块后，就会出发此钩子
      succeedModule: new SyncHook(["module"]),
    };
  }

  // 开始编译一个新的入口
  addEntry(context, entry, name, finnalCallback) {
    this._addModuleChain(context, entry, name, (err, module) => {
      finnalCallback(err, module);
    });
  }

  _addModuleChain(context, rawRequest, name, callback) {
    // 通过模块工厂创建一个模块
    let entryModule = normalModuleFactory.create({
      name, // main
      context: this.context,
      rawRequest, // 相对路径
      resource: path.posix.join(context, rawRequest), // 入口的绝对路径
      parser,
    });

    this.entries.push(entryModule); // 给入口模块数组添加一个模块
    this.modules.push(entryModule); // 给普通模块数组添加一个模块
    const afterBuild = (err) => {
      // TODO 编译依赖的模块
      return callback(err, entryModule);
    };
    this.buildModule(entryModule, afterBuild);
  }

  // 编译模块
  buildModule(module, afterBuild) {
    // 模块真正的编译逻辑其实是放在module内部完成
    module.build(this, (err) => {
      // 走到这意味着一个module已经编译完成了
      this.hooks.succeedModule.call(module);
      afterBuild(err);
    });
  }
}

module.exports = Compilation;
