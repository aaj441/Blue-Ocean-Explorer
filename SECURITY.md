# Security Documentation

This document outlines the security measures implemented in the Blue Ocean Explorer application.

## Security Overview

The application implements multiple layers of security to protect user data and prevent common web vulnerabilities.

## Authentication & Authorization

### Password Security

- **Minimum Length**: 8 characters
- **Maximum Length**: 128 characters
- **Hashing**: bcrypt with salt rounds of 10
- **Password Requirements**:
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number
  - At least one special character
  - Not in common password list

### JWT Tokens

- **Algorithm**: HS256
- **Expiration**: 30 days
- **Secret**: Environment variable (never committed)
- **Validation**: Structure and signature validation before processing

### Session Management

- Tokens stored securely (httpOnly cookies recommended for production)
- Last login timestamp tracked
- Session invalidation on password change

## Input Validation & Sanitization

### Implemented Sanitizers

1. **HTML Sanitization**
   - Escapes `<`, `>`, `"`, `'`, `&`, `/`
   - Prevents XSS attacks

2. **SQL Sanitization**
   - Escapes single quotes
   - Removes SQL comment markers
   - Removes semicolons
   - Note: Prisma uses parameterized queries by default

3. **File Name Sanitization**
   - Removes directory traversal sequences (`..`)
   - Removes path separators
   - Replaces special characters
   - Truncates to 255 characters

4. **Email Sanitization**
   - Converts to lowercase
   - Trims whitespace
   - RFC 5322 validation

5. **URL Sanitization**
   - Allows only relative URLs or whitelisted domains
   - Prevents open redirect attacks

### Detection Systems

- SQL injection pattern detection
- XSS pattern detection
- Null byte removal
- String length limits

## Rate Limiting

### Implementation

- In-memory rate limiter with automatic cleanup
- Tracks requests per identifier (IP, user ID)
- Configurable limits and time windows

### Default Limits

- **Authentication**: 5 attempts per 15 minutes
- **API Requests**: 100 requests per minute
- **AI Operations**: 20 requests per minute

### Rate Limit Response

- HTTP 429 Too Many Requests
- Includes retry-after information
- Logs security events

## Security Headers

### Implemented Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' https:;
frame-ancestors 'none';
```

## CORS Configuration

- Strict origin validation in production
- Credentials support for authenticated requests
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

## Error Handling

### Security Considerations

- No sensitive information in error messages
- Generic error messages for authentication failures
- Detailed errors only in development mode
- Error logging with security context

### Error Boundary

- Catches React errors
- Prevents information disclosure
- User-friendly error messages
- Developer details in development only

## Logging & Monitoring

### Security Logging

- Authentication attempts (success/failure)
- Authorization failures
- Rate limit violations
- Input validation failures
- Suspicious patterns detected

### Log Levels

- **DEBUG**: Development details
- **INFO**: Normal operations
- **WARN**: Potential security issues
- **ERROR**: Security violations

### Audit Trail

- User registration
- User login
- Password changes
- Permission changes
- Data modifications

## Data Protection

### At Rest

- Passwords hashed with bcrypt
- Sensitive data encrypted (when applicable)
- Secure database configuration

### In Transit

- HTTPS enforced in production
- Strict-Transport-Security header
- TLS 1.2+ required

### Data Minimization

- Collect only necessary data
- Regular data cleanup
- Retention policies

## Environment Variables

### Required Security Variables

```
JWT_SECRET=<strong-random-secret>
ADMIN_PASSWORD=<strong-password>
NODE_ENV=production
```

### Security Best Practices

- Never commit secrets to version control
- Use different secrets per environment
- Rotate secrets regularly
- Use secret management tools in production

## Vulnerability Prevention

### SQL Injection

✅ **Prevention**:
- Prisma ORM with parameterized queries
- Input validation with Zod
- SQL pattern detection
- Input sanitization

### Cross-Site Scripting (XSS)

✅ **Prevention**:
- HTML sanitization
- Content Security Policy
- React's built-in XSS protection
- Input validation
- Output encoding

### Cross-Site Request Forgery (CSRF)

⚠️ **Recommended**:
- Implement CSRF tokens for state-changing operations
- SameSite cookie attribute
- Origin validation

### Directory Traversal

✅ **Prevention**:
- File name sanitization
- Path validation
- Restricted file access

### Denial of Service (DoS)

✅ **Prevention**:
- Rate limiting
- Request size limits
- Query complexity limits
- Timeout configurations

### Brute Force Attacks

✅ **Prevention**:
- Rate limiting on authentication
- Account lockout (recommended)
- CAPTCHA (recommended for production)
- Monitoring failed attempts

## Security Checklist

### Development

- [ ] All inputs validated with Zod
- [ ] Sensitive data never logged
- [ ] No secrets in code
- [ ] Dependencies regularly updated
- [ ] Security linter rules enabled

### Pre-Production

- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] Error messages sanitized
- [ ] Logging configured
- [ ] Secrets rotated
- [ ] Security scan performed

### Production

- [ ] WAF configured (recommended)
- [ ] DDoS protection active
- [ ] Monitoring alerts set up
- [ ] Backup encryption enabled
- [ ] Incident response plan ready
- [ ] Security audit completed

## Incident Response

### Detection

- Monitor security logs
- Set up alerts for:
  - Multiple failed logins
  - Rate limit violations
  - Unusual patterns
  - Error spikes

### Response Steps

1. **Identify**: Determine nature and scope
2. **Contain**: Limit damage
3. **Eradicate**: Remove threat
4. **Recover**: Restore services
5. **Learn**: Document and improve

### Contact

- Security issues: security@yourcompany.com
- Responsible disclosure appreciated

## Security Tools

### Recommended

- **SAST**: ESLint with security plugins
- **Dependency Scanning**: npm audit, Snyk
- **Secret Scanning**: git-secrets, TruffleHog
- **Container Scanning**: Trivy, Clair
- **Runtime Protection**: WAF, RASP

## Compliance

Consider implementing for regulated industries:

- **GDPR**: Data protection, right to deletion
- **HIPAA**: Healthcare data security
- **PCI DSS**: Payment card data
- **SOC 2**: Security controls

## Regular Security Tasks

### Daily
- Monitor security logs
- Check failed authentication attempts

### Weekly
- Review error logs
- Update dependencies

### Monthly
- Security scan
- Access review
- Rotate secrets (if applicable)

### Quarterly
- Security audit
- Penetration testing (recommended)
- Update security documentation

## Security Training

Ensure development team knows:

- OWASP Top 10
- Secure coding practices
- Common vulnerabilities
- Incident response procedures

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Security Headers](https://securityheaders.com/)

## Version History

- v1.0.0 (2025-10-22): Initial security implementation
