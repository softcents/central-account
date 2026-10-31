module.exports = {
  apps: [
    {
      name: 'account-api',
      cwd: '/www/wwwroot/account.softcents.com/apps/api',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'account-web',
      cwd: '/www/wwwroot/account.softcents.com/apps/web',
      script: '/www/wwwroot/account.softcents.com/node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
