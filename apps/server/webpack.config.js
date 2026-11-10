/* eslint-disable @typescript-eslint/no-var-requires */
// Lambda 배포용 단일 번들 (dist/bundle.js) — handler: bundle.handler
const path = require("path");

const CopyPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const webpack = require("webpack");

// NestJS 가 선택적으로 require 하는 모듈 — 설치돼 있지 않으면 번들에서 제외
const lazyImports = [
  "@nestjs/microservices",
  "@nestjs/websockets",
  "@nestjs/microservices/microservices-module",
  "@nestjs/websockets/socket-module",
  "class-transformer/storage",
];

const prismaClientDir = path.resolve(
  __dirname,
  "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client",
);

module.exports = {
  mode: "production",
  entry: "./src/lambda/functions/api-server/main.ts",
  target: "node",
  externals: [],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: { transpileOnly: true, configFile: "tsconfig.build.json" },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs2",
    clean: true,
  },
  // NestJS DI 는 클래스 이름에 의존하지 않지만, 스택 트레이스 가독성을 위해 minify 하지 않음
  optimization: { minimize: false, splitChunks: false, runtimeChunk: false },
  performance: { hints: false },
  plugins: [
    new webpack.IgnorePlugin({
      checkResource(resource) {
        if (!lazyImports.includes(resource)) return false;
        try {
          require.resolve(resource);
          return false;
        } catch {
          return true;
        }
      },
    }),
    // Prisma 쿼리 엔진(Lambda = rhel-openssl-3.0.x) + schema 를 번들 옆에 복사
    new CopyPlugin({
      patterns: [
        { from: `${prismaClientDir}/libquery_engine-rhel-*.node`, to: "[name][ext]" },
        { from: `${prismaClientDir}/schema.prisma`, to: "[name][ext]" },
      ],
    }),
  ],
  node: { __dirname: false },
  stats: "errors-warnings",
};
