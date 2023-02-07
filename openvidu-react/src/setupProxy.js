const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://iamhyunjun.shop:4443',
      changeOrigin: true,
    })
  );
};