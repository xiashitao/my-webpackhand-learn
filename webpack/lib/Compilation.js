const { SyncHook } = require("tapable");

const NormalModuleFactory = require("./NormalModuleFactory");
const Chunk = require("./Chunk.js");

const async = require("neo-async");

const path = require("path");

const normalModuleFactory = new NormalModuleFactory();

const Parser = require("../Parser");
const parser = new Parser();

const ejs = require("ejs");
const fs = require("fs");

const mainTemplate = fs.readFileSync(
  path.join(__dirname, "template", "main.ejs"),
  "utf8"
);

const mainRender = ejs.compile(mainTemplate);

class Compilation {
  constructor(compiler) {
    this.compiler = compiler;
    this.options = compiler.options;
    this.context = compiler.context;
    this.inputFileSystem = compiler.inputFileSystem;
    this.outputFileSystem = compiler.outputFileSystem;
    this.entries = []; // 入口数组， 这里放着所有的入口模块
    this.modules = []; // 模块的数组，这里放着所有的模块
    this._modules = {}; // key 是模块id value 是模块对象
    this.chunks = []; // 代码块
    this.files = []; // 这里放着本次编译所有的产出的文件名
    this.assets = {}; // 存放着生成资源，key是文件名，value是文件内容
    this.hooks = {
      // 当你成功构建完成一个模块后，就会出发此钩子
      succeedModule: new SyncHook(["module"]),
      seal: new SyncHook(),
      beforeChunks: new SyncHook(),
      afterChunks: new SyncHook(["chunks"]),
    };
  }

  // 开始编译一个新的入口
  addEntry(context, entry, name, finnalCallback) {
    this._addModuleChain(context, entry, name, (err, module) => {
      finnalCallback(err, module);
    });
  }

  _addModuleChain(context, rawRequest, name, callback) {
    this.createModule(
      {
        name,
        context,
        rawRequest,
        parser,
        resource: path.posix.join(context, rawRequest),
      },
      (entryModule) => this.entries.push(entryModule),
      callback
    );
  }

  /* 
    data: 要编译的模块信息
    addEntry: 可选的增加入口的方法，如果这个模块是入口模块，如果不是的话就什么都不做
    callback: 回调
  */

  createModule(data, addEntry, callback) {
    // 通过模块工厂创建一个模块
    let module = normalModuleFactory.create(data);
    module.moduleId = "./" + path.posix.relative(this.context, module.resource);
    addEntry && addEntry(module);

    this.modules.push(module); // 给普通模块数组添加一个模块
    this._modules[module.moduleId] = module; // 保存一下对应信息
    const afterBuild = (err, module) => {
      if (module.dependencies.length > 0) {
        // 如果大于0，说明有依赖
        this.processModuleDependencies(module, (err) => {
          callback(err, module);
        });
      } else {
        callback(err, module);
      }
    };
    this.buildModule(module, afterBuild);
  }

  // 处理编译模块依赖
  processModuleDependencies(module, callback) {
    let dependencies = module.dependencies;
    // 遍历依赖模块，全部开始编译，当所有的依赖模块全部编译完成后才调用callback
    async.forEach(
      dependencies,
      (dependency, done) => {
        let { name, context, rawRequest, resource, moduleId } = dependency;
        this.createModule(
          {
            name,
            context,
            rawRequest,
            parser,
            resource,
            moduleId,
          },
          null,
          done
        );
      },
      callback
    );
  }

  // 编译模块
  buildModule(module, afterBuild) {
    // 模块真正的编译逻辑其实是放在module内部完成
    module.build(this, (err) => {
      // 走到这意味着一个module已经编译完成了
      this.hooks.succeedModule.call(module);
      afterBuild(err, module);
    });
  }

  // 封装，把模块封装成代码块chunk
  seal(callback) {
    this.hooks.seal.call();
    this.hooks.beforeChunks.call(); // 开始准备生成代码块
    // 一般来说，每个入口会生产一个代码块
    for (const entryModule of this.entries) {
      const chunk = new Chunk(entryModule);
      this.chunks.push(chunk);
      // 对所有的模块进行过滤，找出那些名称跟这个chunk一样的模块，组成一个数组赋给chunk.modules
      chunk.modules = this.modules.filter(
        (module) => module.name === chunk.name
      );
    }
    this.hooks.afterChunks.call(this.chunks);
    // 生成代码块之后，要生成代码块对应资源
    this.createChunkAssets();
    callback();
  }

  createChunkAssets() {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const file = chunk.name + ".js"; // 只拿到了文件名
      chunk.files.push(file);
      let source = mainRender({
        entryModuleId: chunk.entryModule.moduleId, // ./src/index.js
        modules: chunk.modules, // 此代码块对应的模块数组
      });
      this.emitAsset(file, source);
    }
  }

  emitAsset(file, source) {
    this.assets[file] = source;
    this.files.push(file);
  }
}

module.exports = Compilation;
