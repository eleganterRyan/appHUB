/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    // 获取环境变量中的API服务器地址，默认为localhost:5000
    const apiUrl = process.env.API_SERVER_URL || 'http://localhost:5000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`, // 根据环境变量代理到后端API服务器
      },
    ]
  },
}

module.exports = nextConfig 