const checkEnvVariables = require("./check-env-variables")
const path = require("path")

checkEnvVariables()

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  cacheComponents: true,
  outputFileTracingRoot: path.join(__dirname, "../"),
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
    ],
  },
}

module.exports = nextConfig
