# RTLCSS API Service - Production Deployment Guide

This guide provides comprehensive instructions for deploying the RTLCSS API service in a production environment. Following these best practices will ensure your API service is secure, scalable, and reliable.

## Prerequisites

Before deployment, ensure you have the following:

- A Linux-based server with at least 2GB RAM
- Node.js 14.x or later installed
- Docker and Docker Compose (if using containerized deployment)
- Nginx or another reverse proxy for TLS termination
- Domain name with SSL/TLS certificate
- Basic understanding of Linux system administration

## Deployment Options

### Option 1: Docker Deployment (Recommended)

Using Docker provides consistency, isolation, and easier scaling.

#### Step 1: Prepare your environment

1. Clone the repository to your server:
   ```bash
   git clone https://github.com/yourusername/rtlcss-api.git
   cd rtlcss-api
   ```

2. Create an `.env` file for configuration:
   ```bash
   cp .env.example .env
   nano .env
   ```

3. Configure the environment variables:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=production

   # Security
   AUTH_SECRET_KEY=your_secure_random_key_here
   ADMIN_API_TOKEN=your_secure_admin_token_here

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=50

   # File Upload Limits
   MAX_FILE_SIZE=10485760
   ```

#### Step 2: Build and deploy with Docker Compose

1. Start the service using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Verify that the containers are running:
   ```bash
   docker-compose ps
   ```

3. Check logs to ensure everything is working correctly:
   ```bash
   docker-compose logs -f api
   ```

#### Step 3: Set up SSL with Nginx

1. Configure Nginx for SSL termination:
   ```bash
   cp nginx/conf.d/default.conf /etc/nginx/conf.d/rtlcss-api.conf
   ```

2. Replace placeholders in the configuration with your domain and certificate paths:
   ```bash
   sed -i 's/rtlcss-api.example.com/your-domain.com/g' /etc/nginx/conf.d/rtlcss-api.conf
   ```

3. Install SSL certificates (Let's Encrypt recommended):
   ```bash
   certbot --nginx -d your-domain.com
   ```

4. Test and reload Nginx:
   ```bash
   nginx -t
   systemctl reload nginx
   ```

### Option 2: Native Node.js Deployment

For environments where Docker is not available or preferable.

#### Step 1: Prepare your environment

1. Clone the repository to your server:
   ```bash
   git clone https://github.com/yourusername/rtlcss-api.git
   cd rtlcss-api
   ```

2. Install dependencies:
   ```bash
   npm ci --only=production
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   nano .env
   ```

4. Configure the environment variables as shown in the Docker section.

#### Step 2: Set up process management with PM2

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Create a PM2 configuration file:
   ```bash
   cat > ecosystem.config.js << EOL
   module.exports = {
     apps: [{
       name: 'rtlcss-api',
       script: 'src/server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
       },
       max_memory_restart: '500M'
     }]
   };
   EOL
   ```

3. Start the application with PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

4. Save the PM2 configuration to run on reboot:
   ```bash
   pm2 save
   pm2 startup
   ```

#### Step 3: Set up Nginx as reverse proxy

Follow the same Nginx setup as described in the Docker deployment option.

## Production Hardening

### Security Recommendations

1. **Set secure environment variables**:
   - Use a strong, random `AUTH_SECRET_KEY`
   - Set a complex `ADMIN_API_TOKEN`
   - Never commit these to version control

2. **Firewall configuration**:
   ```bash
   # Allow only necessary ports
   ufw allow ssh
   ufw allow http
   ufw allow https
   ufw enable
   ```

3. **User permissions**:
   - Run the application as a non-root user:
   ```bash
   useradd -r -s /bin/false rtlcssapi
   chown -R rtlcssapi:rtlcssapi /path/to/rtlcss-api
   ```

4. **Configure security headers**:
   - All security headers are automatically set by Helmet middleware
   - Review and customize `security.js` middleware if needed

5. **Rate limiting**:
   - Adjust rate limits based on expected traffic
   - Consider using Redis for rate limiting in multi-instance deployments

### Performance Optimization

1. **Adjust Node.js settings**:
   ```bash
   # In ecosystem.config.js for PM2
   node_args: '--max_old_space_size=2048 --max-http-header-size=16384'
   ```

2. **Enable compression in Nginx**:
   ```nginx
   gzip on;
   gzip_comp_level 5;
   gzip_min_length 256;
   gzip_proxied any;
   gzip_vary on;
   gzip_types
     application/javascript
     application/json
     text/css
     text/plain;
   ```

3. **Optimize cache settings**:
   - Update cache TTL in `services/cache.js` based on your usage patterns
   - Consider implementing Redis as a cache store for multi-instance deployments

### Monitoring and Maintenance

1. **Set up monitoring** with Prometheus and Grafana:
   - Install the Prometheus Node.js client
   - Expose metrics on a separate port
   - Configure a Grafana dashboard for visualization

2. **Implement log management**:
   - Send logs to a central service using a log forwarder
   - Consider services like ELK Stack, Graylog, or a managed service

3. **Regular maintenance checklist**:
   - Update dependencies monthly: `npm audit fix`
   - Rotate API tokens quarterly
   - Monitor disk space for uploaded files
   - Review and analyze error logs weekly

## Scaling Strategies

### Horizontal Scaling

1. **Deploy multiple instances**:
   - For Docker: Increase replicas in docker-compose.yml
   - For PM2: Adjust 'instances' in ecosystem.config.js

2. **Add load balancing**:
   ```nginx
   upstream rtlcssapi {
     server 10.0.0.1:3000;
     server 10.0.0.2:3000;
     server 10.0.0.3:3000;
   }

   server {
     listen 443 ssl;
     server_name your-domain.com;
     
     location / {
       proxy_pass http://rtlcssapi;
       # Other proxy settings...
     }
   }
   ```

3. **Implement session sharing**:
   - Replace in-memory storage with Redis for API keys and stats
   - Update `authService.js` and `statsService.js` to use Redis

### Vertical Scaling

1. **Increase server resources**:
   - Upgrade CPU and RAM for the host machine
   - Increase container resource limits if using Docker

2. **Optimize Node.js settings**:
   - Adjust garbage collection settings
   - Increase memory limits based on server capacity

## Backup and Recovery

1. **Regular database backups**:
   - If using Redis or another database, set up automated backups
   - Store backups offsite or in a different cloud region

2. **Application configuration backups**:
   - Backup .env and configuration files
   - Document custom settings in a secure location

3. **Recovery plan**:
   - Create a runbook for common failure scenarios
   - Test recovery procedures periodically
   - Document step-by-step restoration process

## Implementation Specifics for WordPress Plugin Integration

If you're deploying this API specifically for the WP Asset Manager & RTL Converter WordPress plugin:

1. **Domain considerations**:
   - Consider using a subdomain like `api.yourdomain.com`
   - Ensure the domain has proper CORS settings for WordPress sites

2. **Rate limiting**:
   - Adjust rate limits based on the number of WordPress sites
   - A good rule of thumb: 50 requests per 15 minutes per site

3. **WordPress-specific monitoring**:
   - Monitor conversion patterns from WordPress sites
   - Set up alerts for failed WordPress plugin requests

## Troubleshooting Common Issues

### API Connection Issues

**Symptom**: WordPress plugin can't connect to the API
**Solutions**:
- Check Nginx access and error logs
- Verify the domain resolves correctly with `dig`
- Ensure firewall rules allow connections from WordPress hosts
- Test API connections from the server using `curl`

### Performance Issues

**Symptom**: Slow response times
**Solutions**:
- Check server load with `top` or `htop`
- Review Node.js memory usage with `pm2 monit`
- Analyze logs for slow queries or operations
- Increase cache TTL or server resources

### Security Alerts

**Symptom**: Failed authentication attempts
**Solutions**:
- Review access logs for patterns
- Temporarily block suspicious IPs
- Rotate compromised API credentials
- Ensure all security headers are properly applied

## Conclusion

A proper production deployment ensures your RTLCSS API service is reliable, secure, and performant. By following these guidelines, you can create a robust infrastructure that supports your WordPress integration or other client applications.

Remember to regularly review server performance, security updates, and error logs to maintain optimal service quality.

For additional assistance, contact support@rtlcss-api.example.com or refer to the detailed documentation in the repository.