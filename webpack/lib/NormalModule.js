const types = require("babel-types");
const generate = require("babel-generator").default;
const traverse = require("babel-traverse").default;

const path = require("path");
class NormalModule {
  constructor(data) {
    const { name, context, rawRequest, resource, parser, moduleId } = data;
    this.moduleId = moduleId;
    this.name = name;
    this.context = context;
    this.rawRequest = rawRequest;
    this.resource = resource;
    // 这是AST解析器，可以把源代码转成AST
    this.parser = parser;
    this._source;
    this._ast; //
    // 当前模块依赖的信息
    this.dependencies = [];
  }

  build(compilation, callback) {
    // 1. 从硬盘上把模块内容读出来，读成一个文本
    // 2. 可能它不是一个JS模块，所以会走loader的转换，最终肯定要得到一个JS模块代码，得不到就报错了
    // 3. 把这个JS模块代码经过parser处理转成抽象语法书AST
    // 4. 分析AST里面的代码，也就是找 require import 节点， 分析依赖的模块
    // 5. 递归的编译依赖的模块
    // 6. 不停的依次递归上面5步，知道所有的模块都编译完成为止

    /* 
      非常重要的问题
      模块的 ID 问题
      不管你是相对的本地模块 还是第三方模块
      最后它的moduleId 全部都是一个相对于项目根目录的路径
    */

    this.doBuild(compilation, (err) => {
      // callback
      // 得到语法树
      this._ast = this.parser.parse(this._source);
      // 遍历语法树
      traverse(this._ast, {
        // 当遍历到 CallExpression 节点的时候，就会进入回调
        CallExpression: (nodePath) => {
          let node = nodePath.node;
          if (node.callee.name === "require") {
            // 把方法名从 require 改成 __webpack_require__
            node.callee.name = "__webpack_require__";
            // 如果方法名是一个 require 方法
            let moduleName = node.arguments[0].value; // 模块的名称
            // 获得了一个可能的扩展名
            let extName =
              moduleName.split(path.posix.sep).pop().indexOf(".") === -1
                ? ".js"
                : "";
            // 获取依赖模块（./src/title.js）的绝对路径
            let depResource = path.posix.join(
              path.posix.dirname(this.resource),
              moduleName + extName
            );

            let depModuleId =
              "./" + path.posix.relative(this.context, depResource);
            // 把 require 方法的参数改成模块的 ID，从 ./title.js 改成 ./src/title.js
            node.arguments = [types.stringLiteral(depModuleId)];
            this.dependencies.push({
              name: this.name, // main
              context: this.context, // 根目录
              rawRequest: moduleName, // 模块的相对路径 原始路径
              moduleId: depModuleId, // 相对于根目录的相对路径 ，以./开头
              resource: depResource, // 依赖模块的绝对路径
            });
          }
        },
      });
      let { code } = generate(this._ast);
      this._source = code;
      callback();
    });
  }

  doBuild(compilation, callback) {
    // 1. 读取模块的源代码
    this.getSource(compilation, (err, source) => {
      // 把最原始的代码存放到当前模块的_source 属性上
      // loader 的逻辑可以写在这里
      this._source = source;
      callback();
    });
  }

  getSource(compilation, callback) {
    compilation.inputFileSystem.readFile(this.resource, "utf8", callback);
  }
}
module.exports = NormalModule;
