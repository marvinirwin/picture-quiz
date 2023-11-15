/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.test.{ts,tsx}"],
  serverModuleFormat: "cjs",
  browserNodeBuiltinsPolyfill: {
    modules: {
      util: true,
      events: true,
      fs: true,
      "fs/promises": true,
      buffer: true,
      stream: true,
      crypto: true,
      path: true,
      os: true,
      http: true,
      assert: true,
      tls: true,
      net: true,
      url: true,
      https: true,
      child_process: true,
      querystring: true,
    },
  },
};
