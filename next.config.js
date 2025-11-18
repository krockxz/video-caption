/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/compositor',
  ],
  webpack: (config, { isServer }) => {
    // Ignore .d.ts files completely
    config.module.rules.push({
      test: /\.d\.ts$/,
      use: 'ignore-loader',
    })

    // Configure module resolution for problematic packages
    config.resolve = {
      ...config.resolve,
      extensionAlias: {
        '.js': ['.js', '.ts', '.tsx'],
        '.mjs': ['.mjs', '.mts'],
        '.jsx': ['.jsx', '.tsx'],
      },
    }

    // Handle specific esbuild issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'fs': false,
      'path': false,
    }

    return config
  },
}

module.exports = nextConfig