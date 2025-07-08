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
})(nextConfig);
