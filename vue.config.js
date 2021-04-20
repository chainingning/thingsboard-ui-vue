const webpack = require('webpack')
const path = require('path')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const productionGzipExtensions = ['js', 'css']

const isProduction = process.env.NODE_ENV === 'production'
const { library } = require('./dll.config')
const proxyIp = require('./src/config/proxyIp')
const proxy = {}
for (const key in proxyIp) {
  proxy[`/${key}`] = {
    target: proxyIp[key],
    changeOrigin: true,
    secure: true,
    pathRewrite: {
      [`^/${key}`]: ''
    }
  }
}

module.exports = {
  // 部署应用时的基本 URL
  publicPath: isProduction ? './' : '/',
  // build时构建文件的目录，构建时传入 --no-clean 可关闭该行为
  outputDir: 'dist',
  // build时放置生成的静态资源（js、css、img、fonts）的（相对于outputDir的）目录
  assetsDir: '',
  // 指定生成的 index.html 的输出路劲（相对于outputDir）。也可以是一个绝对路劲。
  indexPath: 'index.html',
  // 默认在生成的静态资源文件名中包含hash以控制缓存
  filenameHashing: true,
  // 是否启用eslint
  lintOnSave: !isProduction,
  // 设为false打包时不生成.map文件
  productionSourceMap: false,
  css: {
    loaderOptions: {
      scss: {
        prependData: '@import "~@/assets/scss/global.scss";'
      }
    }
  },
  devServer: {
    open: true,
    host: '0.0.0.0',
    port: 8080,
    proxy
  },
  configureWebpack: {
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.js',
        '@img': '@/assets/images',
        '@echarts': '@/components/ECharts'
      }
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name (module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
              return `npm.${packageName.replace('@', '')}`
            }
          }
        }
      }
    },
    plugins: [
      new MonacoWebpackPlugin({
        languages: ['javascript', 'css', 'scss', 'html', 'json']
      }),
      ...Object.keys(library).map(name => {
        return new webpack.DllReferencePlugin({
          context: '.',
          manifest: require(`./public/dll/${name}-manifest.json`)
        })
      }),
      new AddAssetHtmlPlugin(Object.keys(library).map(name => {
        return {
          filepath: require.resolve(path.resolve(`./public/dll/${name}.dll.js`)),
          includeSourcemap: false,
          publicPath: './dll',
          outputPath: './dll'
        }
      })),
      // 配置compression-webpack-plugin压缩
      new CompressionWebpackPlugin({
        algorithm: 'gzip',
        test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
        threshold: 10240,
        minRatio: 0.8
      })
    ]
  }
}
