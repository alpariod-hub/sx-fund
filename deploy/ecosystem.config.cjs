// PM2 ecosystem config — sx-fund-api
// Usage:
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 reload sx-fund-api     ← zero-downtime reload
//   pm2 logs sx-fund-api
//   pm2 monit

module.exports = {
  apps: [
    {
      name: "sx-fund-api",
      script: "/var/www/sx-fund/artifacts/api-server/dist/index.mjs",

      // Node flags
      node_args: "--enable-source-maps",

      // Environment — production values loaded from .env.production
      env_production: {
        NODE_ENV: "production",
        PORT: "8080",
      },

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 2000,

      // Logging
      out_file: "/var/log/sx-fund/api-out.log",
      error_file: "/var/log/sx-fund/api-error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      log_type: "json",

      // Memory limit — restart if exceeds 512 MB
      max_memory_restart: "512M",

      // Watch mode disabled in production (use pm2 reload instead)
      watch: false,

      // Graceful shutdown — wait for in-flight requests
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: false,

      // Source maps for readable stack traces in logs
      source_map_support: true,
    },
  ],
};
