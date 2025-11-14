# Deployment & Configuration Guide

## Architecture Overview

### Frontend
- **Platform**: Vercel
- **Framework**: React + Vite
- **CDN**: Global edge network (70+ locations)

### Backend
- **Database**: Supabase PostgreSQL 17.6
- **Edge Functions**: Supabase Deno runtime
- **Region**: US-West (LAX) via Cloudflare
  - ⚠️ **Note**: Not EU-hosted. For GDPR compliance, consider migrating to EU region.

### External APIs
- **Barion Payment**: Test environment (https://api.test.barion.com)
- **Billingo Invoice**: API v3 (https://api.billingo.hu/v3)
- **Packeta Shipping**: (https://www.zasilkovna.cz/api)

## Security Features Implemented

### 1. Webhook Idempotency
- **Table**: `webhook_events`
- **Mechanism**: Event ID based deduplication
- **Protection**: Prevents duplicate payment processing

### 2. Database Transactions
- Payment status updates are atomic
- Order status + inventory decrement in single transaction
- Rollback on any failure

### 3. Structured Logging
- **Format**: JSON with trace IDs
- **Fields**: timestamp, traceId, level, message, data
- **Trace ID Pattern**: `{service}-{uuid}`
  - Example: `barion-webhook-550e8400-e29b-41d4-a716-446655440000`

### 4. Rate Limiting
- **Table**: `rate_limits`
- **Function**: `check_rate_limit(client_id, endpoint, max_requests, window_seconds)`

#### Rate Limits by Endpoint:
| Endpoint | Max Requests | Window | Client ID |
|----------|--------------|--------|-----------|
| barion-payment | 5 | 60s | user.id |
| barion-webhook | 100 | 60s | IP address |
| billingo-invoice | 10 | 60s | user.id |
| packeta-shipping | 10 | 60s | user.id |

### 5. Row Level Security (RLS)
- ✅ Enabled on all tables
- ✅ Users can only access their own data
- ✅ Admin operations use service role key

## Environment Variables

### Required for Production

#### Vercel (Frontend)
```env
VITE_SUPABASE_URL=https://glbbcuceohohtqpxmjdk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
```

#### Supabase (Edge Functions - Auto-configured)
```env
SUPABASE_URL=https://glbbcuceohohtqpxmjdk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...
SUPABASE_DB_URL=postgresql://...
```

#### External Services (Set in Supabase Dashboard → Edge Functions → Secrets)
```env
BARION_POS_KEY=your_barion_pos_key
BILLINGO_API_KEY=your_billingo_api_key
PACKETA_API_KEY=your_packeta_api_key
PACKETA_API_PASSWORD=your_packeta_password
```

## Deployment Steps

### 1. Deploy to Vercel
```bash
# Connect to Vercel
npx vercel login

# Deploy
npx vercel --prod

# Set environment variables
npx vercel env add VITE_SUPABASE_URL
npx vercel env add VITE_SUPABASE_ANON_KEY
```

### 2. Edge Functions (Already Deployed)
- ✅ barion-payment
- ✅ barion-webhook
- ✅ billingo-invoice
- ✅ packeta-shipping

All functions include:
- CORS headers
- Structured logging
- Rate limiting
- Error handling

## Monitoring & Logging

### View Logs
```bash
# Supabase Dashboard → Edge Functions → Function Name → Logs
```

### Log Format
```json
{
  "timestamp": "2025-11-06T10:30:45.123Z",
  "traceId": "barion-webhook-550e8400-e29b-41d4-a716-446655440000",
  "level": "INFO",
  "message": "Webhook processed successfully",
  "data": {
    "orderId": "uuid",
    "paymentStatus": "captured"
  }
}
```

### Key Metrics to Monitor
1. **Webhook Processing Time**: Should be < 30s
2. **Rate Limit Hits**: High values indicate potential attack
3. **Failed Transactions**: Should be < 1%
4. **Duplicate Webhooks**: Logged as WARN with "already processed"

## GDPR & Data Compliance

### Current Status
- ⚠️ Database hosted in US-West (LAX)
- ✅ All personal data encrypted at rest
- ✅ RLS policies enforce data isolation
- ✅ Users can only access their own data

### Recommended for EU Compliance
1. Migrate Supabase project to EU region (Frankfurt)
2. Update DNS to point to EU endpoint
3. Verify all data stays in EU

### Data Retention
- Orders: Indefinite (business requirement)
- Webhook events: Consider cleanup after 90 days
- Rate limit records: Auto-cleanup after 24 hours

## Troubleshooting

### Webhook Not Processing
1. Check `webhook_events` table for error_message
2. Search logs for traceId
3. Verify Barion webhook URL in dashboard

### Rate Limit Issues
```sql
-- Check current rate limits
SELECT * FROM rate_limits WHERE client_id = 'user-id';

-- Reset rate limit manually
DELETE FROM rate_limits WHERE client_id = 'user-id' AND endpoint = 'barion-payment';
```

### Payment Stuck in Pending
1. Check `payments` table for status
2. Look for failed transaction in logs
3. Manually trigger webhook with PaymentId

## Performance Optimization

### Database
- ✅ Indexes on frequently queried columns
- ✅ Connection pooling enabled
- ✅ RPC functions for complex operations

### Edge Functions
- ✅ Cold start time: < 500ms
- ✅ Average execution: < 2s
- ✅ Timeout: 60s max

### Frontend (Vercel)
- ✅ Static assets on CDN
- ✅ Automatic compression
- ✅ HTTP/2 & HTTP/3 enabled

## Backup & Recovery

### Database Backups
- Supabase automatic daily backups
- Retention: 7 days
- Manual backup: Export from Dashboard

### Disaster Recovery
1. Database: Restore from Supabase backup
2. Frontend: Redeploy from git
3. Edge Functions: Already versioned in Supabase

## Support & Maintenance

### Regular Tasks
- [ ] Review rate limit logs weekly
- [ ] Check webhook_events for errors monthly
- [ ] Update dependencies quarterly
- [ ] Test payment flow after Barion API changes

### Emergency Contacts
- Barion Support: support@barion.com
- Billingo Support: ugyfelszolgalat@billingo.hu
- Packeta Support: support@packeta.com
