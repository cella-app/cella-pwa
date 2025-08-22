import withPWA from "next-pwa";

const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  async rewrites() {
    return [
      {
        source: '/manifest.json',
        destination: '/manifest.json',
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^\/workspace\/discovery$/, // matches exactly /workspace/discovery
      handler: 'NetworkFirst', // priority data network first for workspace-discovery-page, fallback to cache
      options: {
        cacheName: 'workspace-discovery-page',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
  ]
})(nextConfig);
