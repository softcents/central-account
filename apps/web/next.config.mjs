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
        source: '/api/whmcs/:path*',
        destination: 'http://127.0.0.1:4000/api/whmcs/:path*',
      },
      {
        source: '/api/auth/:path*',
        destination: 'http://127.0.0.1:4000/api/auth/:path*',
      },
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
        source: '/store',
        destination: '/cart',
      },
      {
        source: '/store/:slug*',
        destination: '/cart?group=:slug*',
      },
      {
        source: '/orders',
        destination: '/cart',
      },
      {
        source: '/order',
        destination: '/cart',
      },
      {
        source: '/order.php',
        destination: '/cart',
      },
      {
        source: '/orders.php',
        destination: '/clientarea/orders',
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
        source: '/pwreset.php',
        destination: '/pwreset',
      },
      {
        source: '/supporttickets.php',
        destination: '/clientarea/tickets',
      },
      {
        source: '/contact.php',
        destination: '/contact',
      },
      {
        source: '/knowledgebase.php',
        destination: '/knowledgebase',
      },
      {
        source: '/announcements.php',
        destination: '/announcements',
      },
      {
        source: '/downloads.php',
        destination: '/downloads',
      },
      {
        source: '/networkissues.php',
        destination: '/networkissues',
      },
      {
        source: '/serverstatus.php',
        destination: '/networkissues',
      },
      {
        source: '/domainchecker.php',
        destination: '/domainchecker',
      },
      {
        source: '/affiliates.php',
        destination: '/clientarea/affiliates',
      },
      {
        source: '/aff.php',
        destination: '/clientarea/affiliates',
      },
      {
        source: '/admin/configgeneral.php',
        destination: '/admin/settings?tab=general',
      },
      {
        source: '/admin/configgeneral',
        destination: '/admin/settings?tab=general',
      },
    ];
  },
};

export default nextConfig;
