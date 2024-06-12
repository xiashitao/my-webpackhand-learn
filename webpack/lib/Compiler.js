const {
  AsyncSeriesHook,
  SyncBailHook,
  AsyncParallelHook,
  SyncHook,
} = require("tapable");
const NormalModuleFactory = require("./NormalModuleFactory");
const Compilation = require("./Compilation");
const mkdirp = require("mkdirp");
const path = require("path");

const Stats = require("./Stat.js");

class Compiler {
  constructor(context) {
    // super();
    this.context = context;
    this.hooks = {
      done: new AsyncSeriesHook(["stats"]), // 当编译完成后会触发这个钩子执行
      // 项目根目录的绝对路径，entry是入口文件
      entryOptions: new SyncBailHook(["context", "entry"]),
      make: new AsyncParallelHook(["compilation"]),
      beforeRun: new AsyncSeriesHook(["compiler"]), // 运行前
      run: new AsyncSeriesHook(["compiler"]), // 运行
      beforeCompile: new AsyncSeriesHook(["compilation"]), // 编译前
      compile: new SyncHook(["compilation"]), // 编译
      afterCompile: new AsyncSeriesHook(["compilation"]), // 编译后
      thisCompilation: new SyncHook(["compilation", "params"]), // 开始创建一次新的编译
      compilation: new SyncHook(["compilation", "params"]), // // 创建一个新的 compilation
      emit: new AsyncSeriesHook(["compilation"]), // 发射，写入文件
      done: new AsyncSeriesHook(["stats"]), // 所有的编译全部都完成
    };
  }

  emitAssets(compilation, callback) {
    const emitFile = (err) => {
      const assets = compilation.assets;
      for (let file in assets) {
        let source = assets[file];
        // 是输出文件的绝对路径
        let targetPath = path.posix.join(this.options.output.path, file);
        this.outputFileSystem.writeFileSync(targetPath, source, "utf-8");
      }
      callback();
    };
    // 先触发emit的回调，在写插件的时候emit用的最多，因为它是我们修改输出内容的最后机会
    this.hooks.emit.callAsync(compilation, () => {
      // 先创建输出目录 dist，再写入文件
      mkdirp(this.options.output.path, emitFile);
    });
  }

  // run 方法是开始编译的入口
  run(callback) {
    console.log("compiler run");
    // 编译完成后最终的回调函数
    const finalCallback = (err, stats) => {
      callback(err, stats);
    };
    const onCompiled = (err, compilation) => {
      //   finalCallback(null, new Stats(compilation)); // @TODO
      // 把chunk变成文件写入硬盘
      this.emitAssets(compilation, (err) => {
        let stats = new Stats(compilation);
        this.hooks.done.callAsync(stats, (err) => {
          finalCallback(err, stats);
        });
      });
    };
    this.hooks.beforeRun.callAsync(this, (err) => {
      this.hooks.run.callAsync(this, (err) => {
        this.compile(onCompiled);
      });
    });
  }

  compile(onCompiled) {
    const params = this.newCompilationParams();
    this.hooks.beforeCompile.callAsync(params, (err) => {
      this.hooks.compile.call(params);
      const compilation = this.newCompilation(params);
      this.hooks.make.callAsync(compilation, (err) => {
        // 封装代码块之后编译就完成了
        compilation.seal((err) => {
          // 触发编译完成的钩子
          this.hooks.afterCompile.callAsync(compilation, (err) => {
            onCompiled(err, compilation);
          });
        });
      });
    });
  }

  creatCompilation() {
    return new Compilation(this);
  }

  newCompilation(params) {
    const compilation = this.creatCompilation();
    this.hooks.thisCompilation.call(compilation, params);
    this.hooks.compilation.call(compilation, params);
    return compilation;
  }

  newCompilationParams() {
    const params = {
      // 在创建compilation 之前已经创建了一个普通模块工厂
      normalModuleFactory: new NormalModuleFactory(),
    };
    return params;
  }
}

module.exports = Compiler;
