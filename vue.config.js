// vue.config.js

module.exports = {
  configureWebpack: {
    devtool: "source-map",
  },
  pluginOptions: {
    electronBuilder: {
      chainWebpackMainProcess: (config) => {
        config.plugins.delete("uglify");
      },
      chainWebpackRendererProcess: (config) => {
        config.plugins.delete("uglify");
      },
    },
  },
};
