module.exports = (api) => {
  api.cache(true);
  // https://babeljs.io/docs/en/next/config-files#project-wide-configuration
  return {
    babelrcRoots: [
      // Keep the root as a root
      ".",
    
      // Also consider monorepo packages "root" and load their .babelrc files.
    ],
    "presets": [
      [
        '@babel/env', {
          "targets": {
            "node": "current"
          }
        }
      ]
    ],
    plugins: [
      [
        '@babel/plugin-transform-runtime',
        {
          corejs: 3
        }
      ]
    ]
  };
};