# Non-Functional Requirements (NFR)
# Platform E-Learning Tutor Nomor Satu

**Version:** 1.0  
**Last Updated:** November 15, 2025  

---

## 1. Performance Requirements

### 1.1 Response Time
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Page Load Time (Desktop) | < 2 seconds | Lighthouse, WebPageTest |
| Page Load Time (Mobile) | < 3 seconds | Lighthouse Mobile |
| API Response Time (95th percentile) | < 500ms | Vercel Analytics |
| API Response Time (99th percentile) | < 1 second | Vercel Analytics |
| Time to First Byte (TTFB) | < 600ms | Chrome DevTools |
| First Contentful Paint (FCP) | < 1.8s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Core Web Vitals |
| Cumulative Layout Shift (CLS) | < 0.1 | Core Web Vitals |
| First Input Delay (FID) | < 100ms | Core Web Vitals |

### 1.2 Throughput
- **Concurrent Users**: Support 500 concurrent users without degradation
- **Database Queries**: Handle 1,000 queries per second (QPS)
- **File Uploads**: Support 50 concurrent uploads (max 50MB each)
- **API Requests**: Handle 10,000 requests per minute across all endpoints

### 1.3 Resource Utilization
- **Memory**: Serverless functions shall use < 512MB RAM
- **CPU**: Function execution time < 10 seconds (Vercel limit)
- **Database Connections**: Max 100 concurrent connections (Supabase pooler)
- **Storage**: Optimize images to < 200KB per image

### 1.4 Load Time Optimization
- Code splitting for routes (automatic with Next.js App Router)
- Lazy loading for images below the fold
- Minification of CSS and JavaScript
- Compression (Gzip/Brotli) for static assets
- CDN caching for static assets (Vercel Edge Network)

---

## 2. Security Requirements

### 2.1 Authentication & Authorization
- **NFR-SEC-001**: JWT tokens shall expire after 1 hour (refresh token valid for 7 days)
- **NFR-SEC-002**: Role-based access control (RBAC) enforced at middleware layer
- **NFR-SEC-003**: Database Row Level Security (RLS) policies for all tables
- **NFR-SEC-004**: Account lockout after 5 failed login attempts (15-minute cooldown)
- **NFR-SEC-005**: Password requirements: min 8 characters, 1 uppercase, 1 lowercase, 1 number
- **NFR-SEC-006**: Email verification required before full account access
- **NFR-SEC-007**: Session management with httpOnly cookies (no local storage for tokens)

### 2.2 Data Protection
- **NFR-SEC-008**: All data in transit encrypted via HTTPS (TLS 1.3)
- **NFR-SEC-009**: All data at rest encrypted (Supabase default encryption AES-256)
- **NFR-SEC-010**: Passwords hashed with bcrypt (cost factor 10)
- **NFR-SEC-011**: Sensitive data (payment info) never stored locally (handled by Pakasir)
- **NFR-SEC-012**: Personal data (email, phone) protected by RLS policies

### 2.3 Input Validation & Sanitization
- **NFR-SEC-013**: All user inputs validated with Zod schemas
- **NFR-SEC-014**: File uploads restricted to whitelist: PDF, DOCX, PPTX, JPG, PNG
- **NFR-SEC-015**: File size limits enforced: 50MB for materials, 20MB for submissions
- **NFR-SEC-016**: Rich text input sanitized to prevent XSS (DOMPurify or similar)
- **NFR-SEC-017**: SQL injection prevented by using Prisma ORM (parameterized queries)

### 2.4 API Security
- **NFR-SEC-018**: CSRF protection enabled (Next.js built-in)
- **NFR-SEC-019**: CORS configured to allow only trusted origins
- **NFR-SEC-020**: Rate limiting: 100 requests/min per user, 1000 requests/min per IP
- **NFR-SEC-021**: API keys/secrets stored in environment variables (not in code)
- **NFR-SEC-022**: Webhook signatures verified (HMAC-SHA256 for Pakasir)

### 2.5 File Security
- **NFR-SEC-023**: Uploaded files scanned for malware (optional: integrate ClamAV or VirusTotal)
- **NFR-SEC-024**: File URLs signed with expiration (Supabase signed URLs for private files)
- **NFR-SEC-025**: Directory traversal attacks prevented (sanitize file paths)

### 2.6 Audit & Monitoring
- **NFR-SEC-026**: All admin actions logged in audit_log table
- **NFR-SEC-027**: Failed login attempts logged for security monitoring
- **NFR-SEC-028**: Suspicious activity alerts (e.g., 10+ failed logins) sent to admin
- **NFR-SEC-029**: Security headers configured: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security

---

## 3. Reliability Requirements

### 3.1 Availability
- **NFR-REL-001**: System uptime shall be 99.5% (equivalent to 3.6 hours downtime per month)
- **NFR-REL-002**: Planned maintenance windows announced 48 hours in advance
- **NFR-REL-003**: Planned maintenance during low-traffic hours (2 AM - 5 AM WIB)
- **NFR-REL-004**: Critical bugs fixed within 4 hours of discovery
- **NFR-REL-005**: Non-critical bugs fixed within 48 hours

### 3.2 Fault Tolerance
- **NFR-REL-006**: Graceful degradation: If payment gateway down, display maintenance message
- **NFR-REL-007**: Retry logic for payment webhooks (3 attempts with exponential backoff)
- **NFR-REL-008**: Database connection pooling to handle spikes
- **NFR-REL-009**: Error boundaries in React to prevent full app crashes

### 3.3 Backup & Recovery
- **NFR-REL-010**: Database backups daily at 2 AM WIB (automated by Supabase)
- **NFR-REL-011**: Backup retention: 30 days (7 daily, 4 weekly, 1 monthly)
- **NFR-REL-012**: Point-in-time recovery (PITR) available for last 7 days
- **NFR-REL-013**: Recovery Time Objective (RTO): < 2 hours
- **NFR-REL-014**: Recovery Point Objective (RPO): < 24 hours (daily backups)
- **NFR-REL-015**: File storage backed up weekly (Supabase automatic backups)
- **NFR-REL-016**: Disaster recovery plan documented and tested quarterly

### 3.4 Error Handling
- **NFR-REL-017**: All errors logged with context (user ID, timestamp, stack trace)
- **NFR-REL-018**: User-facing error messages shall be friendly (no stack traces exposed)
- **NFR-REL-019**: 500 errors redirect to custom error page with support contact
- **NFR-REL-020**: 404 errors redirect to custom "Not Found" page with navigation

---

## 4. Scalability Requirements

### 4.1 Horizontal Scalability
- **NFR-SCALE-001**: Serverless architecture (Vercel) auto-scales with traffic
- **NFR-SCALE-002**: Database connection pooling supports 100 concurrent connections
- **NFR-SCALE-003**: CDN caching reduces origin server load by 80%
- **NFR-SCALE-004**: Static assets served from edge locations (Vercel Edge Network)

### 4.2 Data Scalability
- **NFR-SCALE-005**: Database schema optimized with indexes on frequently queried columns
- **NFR-SCALE-006**: Pagination for all list endpoints (max 100 items per page)
- **NFR-SCALE-007**: Soft deletes (archive) instead of hard deletes to preserve data integrity
- **NFR-SCALE-008**: File storage scalable to 100GB (upgrade Supabase plan as needed)

### 4.3 User Scalability
- **NFR-SCALE-009**: System supports up to 10,000 registered users without architecture changes
- **NFR-SCALE-010**: System supports 500 concurrent users (can scale to 2,000 with infrastructure upgrade)

---

## 5. Usability Requirements

### 5.1 Learnability
- **NFR-USA-001**: New users shall complete first enrollment within 5 minutes (with onboarding guide)
- **NFR-USA-002**: Onboarding tutorial displayed on first login for each role
- **NFR-USA-003**: Contextual help tooltips available for complex features
- **NFR-USA-004**: User documentation (PDF/video) accessible from help menu

### 5.2 Efficiency
- **NFR-USA-005**: Frequent tasks achievable in max 3 clicks from dashboard
- **NFR-USA-006**: Search functionality available on all list pages (classes, users, materials)
- **NFR-USA-007**: Keyboard shortcuts for power users (e.g., Ctrl+K for quick search)
- **NFR-USA-008**: Autosave for long forms (quiz creation, assignment creation)

### 5.3 Accessibility
- **NFR-USA-009**: WCAG 2.1 Level AA compliance
- **NFR-USA-010**: Keyboard navigation support (all interactive elements accessible via Tab)
- **NFR-USA-011**: Screen reader compatible (ARIA labels, semantic HTML)
- **NFR-USA-012**: Color contrast ratio min 4.5:1 (text), 3:1 (UI elements)
- **NFR-USA-013**: Focus indicators visible on all interactive elements
- **NFR-USA-014**: Text resizable up to 200% without breaking layout

### 5.4 User Interface
- **NFR-USA-015**: Mobile-responsive design (min viewport 375px)
- **NFR-USA-016**: Consistent UI patterns (buttons, forms, cards) using Shadcn UI
- **NFR-USA-017**: Loading states (skeleton loaders, spinners) for async operations
- **NFR-USA-018**: Success/error feedback for all user actions (toast notifications)
- **NFR-USA-019**: Form validation with inline error messages
- **NFR-USA-020**: Progress indicators for multi-step processes (enrollment, quiz taking)

---

## 6. Maintainability Requirements

### 6.1 Code Quality
- **NFR-MAIN-001**: Code follows consistent style guide (ESLint + Prettier)
- **NFR-MAIN-002**: TypeScript strict mode enabled (no `any` types except where necessary)
- **NFR-MAIN-003**: Code comments for complex business logic
- **NFR-MAIN-004**: Functions max 50 lines (prefer small, composable functions)
- **NFR-MAIN-005**: Components max 300 lines (split into smaller components)

### 6.2 Testing
- **NFR-MAIN-006**: Unit test coverage > 70% for critical business logic
- **NFR-MAIN-007**: Integration tests for all API endpoints
- **NFR-MAIN-008**: E2E tests for critical user flows (enroll → pay → access class)
- **NFR-MAIN-009**: Tests run automatically on every commit (CI/CD via GitHub Actions)

### 6.3 Documentation
- **NFR-MAIN-010**: API endpoints documented with OpenAPI/Swagger spec
- **NFR-MAIN-011**: Database schema documented (ERD diagram)
- **NFR-MAIN-012**: Codebase includes README with setup instructions
- **NFR-MAIN-013**: ADR (Architecture Decision Records) for major technical decisions

### 6.4 Deployment
- **NFR-MAIN-014**: Deployment automated via Git push to main branch (Vercel)
- **NFR-MAIN-015**: Database migrations versioned and tracked (Prisma Migrate)
- **NFR-MAIN-016**: Environment variables managed via Vercel dashboard (no secrets in code)
- **NFR-MAIN-017**: Rollback capability (revert to previous deployment within 5 minutes)

### 6.5 Monitoring & Logging
- **NFR-MAIN-018**: Error tracking configured (Sentry or console logs)
- **NFR-MAIN-019**: Performance monitoring enabled (Vercel Analytics)
- **NFR-MAIN-020**: Logs include timestamp, user ID, action, result
- **NFR-MAIN-021**: Slow queries logged for optimization (queries > 1 second)

---

## 7. Portability Requirements

### 7.1 Browser Compatibility
- **NFR-PORT-001**: Support latest 2 versions of Chrome (100+)
- **NFR-PORT-002**: Support latest 2 versions of Firefox (100+)
- **NFR-PORT-003**: Support latest 2 versions of Safari (15+)
- **NFR-PORT-004**: Support latest 2 versions of Edge (100+)
- **NFR-PORT-005**: Graceful degradation for older browsers (display "unsupported browser" message)

### 7.2 Device Compatibility
- **NFR-PORT-006**: Responsive design for desktop (1920px), tablet (768px), mobile (375px)
- **NFR-PORT-007**: Touch-friendly UI (buttons min 44x44px tap target)
- **NFR-PORT-008**: Support landscape and portrait orientations

### 7.3 Platform Independence
- **NFR-PORT-009**: Database portable to other PostgreSQL providers (not vendor-locked)
- **NFR-PORT-010**: File storage can migrate to other S3-compatible services
- **NFR-PORT-011**: No browser-specific code (use standard Web APIs)

---

## 8. Compliance Requirements

### 8.1 Legal Compliance
- **NFR-COMP-001**: Comply with UU ITE No. 11/2008 (Indonesian IT Law)
- **NFR-COMP-002**: Display Terms of Service and Privacy Policy (users accept on registration)
- **NFR-COMP-003**: Allow users to request data deletion (right to be forgotten)
- **NFR-COMP-004**: Allow users to export their data (data portability)

### 8.2 Payment Compliance
- **NFR-COMP-005**: PCI DSS compliance via Pakasir (no card data stored locally)
- **NFR-COMP-006**: Payment receipts include required information (merchant name, amount, date, method)

### 8.3 Data Retention
- **NFR-COMP-007**: User data retained for 5 years after account deletion (for legal compliance)
- **NFR-COMP-008**: Payment records retained for 7 years (Indonesian tax law)
- **NFR-COMP-009**: Audit logs retained for 1 year

---

## 9. Capacity Requirements

### 9.1 Current Capacity (MVP)
| Resource | Capacity |
|----------|----------|
| Registered Users | 1,000 |
| Concurrent Users | 500 |
| Database Size | 5 GB (Supabase free tier: unlimited with paid plan) |
| File Storage | 10 GB (Supabase free tier: 1GB, upgrade to 100GB) |
| API Requests/month | 5 million (Vercel Pro plan) |
| Serverless Execution Time | 1,000 hours/month (Vercel Pro) |

### 9.2 Growth Projections (Year 1)
| Resource | Projected Need |
|----------|----------------|
| Registered Users | 5,000 |
| Concurrent Users | 1,000 |
| Database Size | 20 GB |
| File Storage | 50 GB |
| API Requests/month | 20 million |

**Scaling Strategy**: Upgrade Supabase to Pro plan ($25/month), Vercel to Pro plan ($20/month)

---

## 10. Environmental Requirements

### 10.1 Infrastructure
- **NFR-ENV-001**: Hosted on cloud infrastructure (Vercel + Supabase Cloud)
- **NFR-ENV-002**: No on-premise servers required
- **NFR-ENV-003**: Auto-scaling serverless functions (no manual intervention)

### 10.2 Network
- **NFR-ENV-004**: Min internet speed: 4G (5 Mbps download, 1 Mbps upload)
- **NFR-ENV-005**: System degrades gracefully on slow connections (progressive enhancement)

### 10.3 Operating System
- **NFR-ENV-006**: Client-side: OS-agnostic (Windows, macOS, Linux, iOS, Android)
- **NFR-ENV-007**: Server-side: Linux (Vercel serverless runtime)

---

## 11. Measurement & Monitoring

### 11.1 Key Performance Indicators (KPIs)
| KPI | Target | Measurement Frequency |
|-----|--------|----------------------|
| System Uptime | 99.5% | Daily |
| API Response Time (P95) | < 500ms | Real-time (Vercel Analytics) |
| Page Load Time (LCP) | < 2.5s | Weekly (Lighthouse) |
| Error Rate | < 0.5% | Daily |
| User Satisfaction (NPS) | > 70 | Quarterly (survey) |
| Payment Success Rate | > 95% | Weekly |

### 11.2 Alerting
- **NFR-MON-001**: Alert if uptime < 99% in 24-hour period
- **NFR-MON-002**: Alert if error rate > 1% in 1-hour period
- **NFR-MON-003**: Alert if API response time (P95) > 1 second in 15-minute period
- **NFR-MON-004**: Alert if payment webhook fails 3 times consecutively

---

## 12. Acceptance Criteria

Platform meets NFRs when:
- [x] All performance targets met (Lighthouse score > 90)
- [x] Security audit passed (no critical vulnerabilities)
- [x] Load testing: 500 concurrent users without errors
- [x] WCAG 2.1 Level AA compliance verified
- [x] Browser compatibility tested on Chrome, Firefox, Safari, Edge
- [x] Mobile responsiveness verified on iOS and Android
- [x] Database backup/restore tested successfully
- [x] Payment flow tested with real transactions (test mode)
- [x] 99.5% uptime maintained for 30 consecutive days (post-launch)

---

**Document End**
