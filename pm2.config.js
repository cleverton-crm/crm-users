module.exports = {
  apps: [
    {
      name: 'micro-users',
      script: './dist/main.js',
      watch: false,
      wait_ready: true,
      stop_exit_codes: [0],
      env: {
        PORT: 4001,
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
