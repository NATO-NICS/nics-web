const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
//const GitRevisionPlugin = require('git-revision-webpack-plugin');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin')
const gitRevisionPlugin = new GitRevisionPlugin();

const paths = {
  webApp:  path.resolve(__dirname, './webapp/src/main/webapp'),
  lib:     path.resolve(__dirname, './webapp/src/main/webapp/js/lib'),
  modules: path.resolve(__dirname, './modules'),
};
paths.iweb = require.resolve('iweb-modules');
paths.iwebDir = paths.iweb.replace('/core/src/main/js/iweb/CoreModule.js', '');
paths.extjsFile = 'ext-all.js';//process.env.NODE_ENV === 'production' ? 'ext-all.js' : 'ext-all-debug.js';
paths.ext = `${paths.iwebDir}/core/src/main/js/lib/extjs/build/${paths.extjsFile}`;
paths.atmosphere = `${paths.iwebDir}/core/src/main/js/lib/atmosphere.js`;

const modulesList = glob.sync(`${paths.modules}/*/src/main/js/nics/modules/`)
  .concat(glob.sync(`${paths.iwebDir}/*/src/main/js/iweb/`))
  .concat([
    'node_modules'
  ]);

class NICSResolverPlugin {
  apply(resolver) {
    const target = resolver.ensureHook('parsed-resolve');
    resolver
      .getHook('before-resolve')
      .tapAsync('NICSResolverPlugin', (request, resolveContext, callback) => {

	//console.debug(request.request)

        if (request.request.startsWith('iweb')) {
          request.request = request.request.replace('iweb/', '');
        } else if (request.request.startsWith('nics/modules')) {
          request.request = request.request.replace('nics/modules/', '');
        } else if (request.request.startsWith('test/js')) {
          request.request = request.request.replace(/test\/js\/(.*)\//gm, `./$1/`);
        } else if (request.request.startsWith('test/')) {
          request.request = request.request.replace('test/data/', '');
        } else if (request.request.startsWith('lib')) {
          request.request = request.request.replace('lib/', '');
        }
        else {
          return callback();
        }
        resolver.doResolve(target, request, null, resolveContext, callback);
      });
  }
}

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  //stats: 'errors-only',
  optimization: {
    minimize: true
  },
  //bail: false,
  entry: {
    app: `${paths.webApp}/js/main.js`
  },
  output: {
    //clean: true,
    path: path.resolve(__dirname, 'webapp/target/dist'),
    filename: 'js/[name].[chunkhash:8].js',
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jquery: 'jquery',
      //chai: 'chai',
      Ext: "ext",
      ext: "ext",
      //smooth: ['lib/smooth', 'Smooth'],
      //Labeler: ['lib/labeler', 'window.d3labeler']
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `${paths.webApp}/home.template.html`),
      filename: `home.html`,
      chunks: ['app'],
      meta: {
        'hash': `${gitRevisionPlugin.branch()}::${gitRevisionPlugin.commithash()}`,
      },
      title: `NICS`,
    }),
  ],
  resolve: {
    // this should fix the jquery dependency issue in HVX when it's being reference
    // symlink
    //symlinks: false,
    plugins: [new NICSResolverPlugin()],
    modules: modulesList,
    alias: {
      ext: paths.ext,
      atmosphere: paths.atmosphere,
      ol: path.resolve(
        __dirname,
        `${paths.iwebDir}/map/src/main/js/lib/ol/ol.js`
      )
    }
  },
  module: {
    noParse: /jquery/,
    rules: [
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      },
      {
        test: paths.ext,
        use: [
	  'expose-loader?exposes=Ext', //some Ext feature expect an Ext global
	  'exports-loader?type=commonjs&exports=single|Ext'
	]
      },
      { 
	test: /atmosphere.js$/,
        use: 'imports-loader?wrapper=window'
      },
      {
        test: /\.js$/,
        exclude: [/node_modules/,/atmosphere.js$/, /ol/, /ext/, /jquery/, /turf/, /d3/],
        use: 'babel-loader'
      },
    ]
  }
};
