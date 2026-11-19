/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: '/api',
  },
  async rewrites() {
    return [
      {
        source: '/clientarea.php',
        destination: '/clientarea',
      },
      {
        source: '/viewinvoice.php',
        destination: '/viewinvoice',
      },
      {
        source: '/submitticket.php',
        destination: '/support/new',
      },
      {
        source: '/cart.php',
        destination: '/cart',
      },
      {
        source: '/login.php',
        destination: '/login',
      },
      {
        source: '/register.php',
        destination: '/register',
      },
      {
        source: '/supporttickets.php',
        destination: '/clientarea/tickets',
      },
      {
        source: '/contact.php',
        destination: '/support/new',
      },
      {
        source: '/knowledgebase.php',
        destination: '/admin/support/kb',
      },
      {
        source: '/announcements.php',
        destination: '/admin/support/announcements',
      },
      {
        source: '/downloads.php',
        destination: '/admin/support/downloads',
      },
    ];
  },
};

export default nextConfig;
