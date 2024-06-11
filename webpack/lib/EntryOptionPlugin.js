const SingleEntryPlugin = require("./SingleEntryPlugin");

const itemToPlugin = (context, item, name) => {
  // 单入口插件
  return new SingleEntryPlugin(context, item, name);
};

class EntryOptionsPlugin {
  apply(compiler) {
    compiler.hooks.entryOptions.tap("EntryOptionsPlugin", (context, entry) => {
      itemToPlugin(context, entry, "main").apply(compiler);
    });
  }
}

module.exports = EntryOptionsPlugin;
