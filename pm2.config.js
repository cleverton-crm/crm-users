module.exports = {
  apps: [
    {
      name: 'crm-users',
      script: './dist/main.js',
      watch: false,
      wait_ready: true,
      stop_exit_codes: [0],
      env: {
        PORT: 5011,
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
