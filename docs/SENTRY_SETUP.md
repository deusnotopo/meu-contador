# Sentry Error Monitoring Setup Guide

## 🔍 Overview

Sentry is configured for production-ready error tracking, performance monitoring, and session replay.

---

## 📋 Setup Instructions

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for free account
3. Create new project (React)
4. Copy your DSN

---

### 2. Add Environment Variable

Create or update `.env` file:

```env
# Sentry Configuration
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0

# Optional: Enable Sentry in development
VITE_SENTRY_DEBUG=false
```

---

### 3. Verify Installation

The Sentry SDK is already installed and configured:

```bash
# Already installed
npm list @sentry/react
```

---

## ⚙️ Configuration

### Current Setup

**File**: `src/lib/sentry.ts`

**Features Enabled**:

- ✅ Error tracking
- ✅ Performance monitoring (10% sample rate in production)
- ✅ Session replay (10% of sessions, 100% on errors)
- ✅ Release tracking
- ✅ User context
- ✅ Breadcrumbs
- ✅ Sensitive data filtering

**Integration Points**:

- `src/main.tsx` - Initialization
- `src/components/ErrorBoundary.tsx` - Error capture
- `src/context/AuthContext.tsx` - User context (optional)

---

## 🎯 Usage Examples

### Manual Error Capture

```typescript
import { captureException, captureMessage } from "@/lib/sentry";

try {
  // Your code
} catch (error) {
  captureException(error as Error, {
    feature: "payment",
    userId: user.id,
  });
}
```

### User Context

```typescript
import { setUser } from "@/lib/sentry";

// On login
setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// On logout
setUser(null);
```

### Breadcrumbs

```typescript
import { addBreadcrumb } from "@/lib/sentry";

addBreadcrumb("User clicked checkout", "user-action", {
  cartTotal: 99.99,
  itemCount: 3,
});
```

### Performance Tracking

```typescript
import { startTransaction } from "@/lib/sentry";

const transaction = startTransaction("checkout-flow", "navigation");

// Your code
await processCheckout();

transaction.finish();
```

---

## 🔒 Privacy & Security

### Sensitive Data Filtering

Automatically filters:

- Authorization headers
- Cookies
- Password fields
- Credit card numbers

### Session Replay

- Text is masked by default
- Media is blocked
- Only 10% of sessions recorded
- 100% of error sessions recorded

---

## 📊 Monitoring

### Sentry Dashboard

Access your dashboard at: `https://sentry.io/organizations/YOUR_ORG/projects/YOUR_PROJECT/`

**Key Metrics**:

- Error rate
- Affected users
- Performance issues
- Session replays

### Alerts

Configure alerts in Sentry dashboard:

**Recommended Alert Rules:**

1. **High Error Rate**
   - Trigger: Error rate > 5% of sessions in 5 minutes
   - Action: Email + Slack notification
   
2. **New Issue Created**
   - Trigger: First occurrence of a new error
   - Action: Email notification
   
3. **Regression Alert**
   - Trigger: Resolved issue reoccurs
   - Action: Email + Slack notification
   
4. **Performance Degradation**
   - Trigger: P95 latency > 3 seconds
   - Action: Email notification
   
5. **Crash Free Rate Drop**
   - Trigger: Crash free rate < 99%
   - Action: Email + Slack notification

**Integration Options:**
- Email notifications
- Slack integration
- PagerDuty integration
- Discord webhooks
- Microsoft Teams

---

## 🧪 Testing

### Test Error Capture

```typescript
// Add to any component for testing
<button
  onClick={() => {
    throw new Error("Test Sentry error");
  }}
>
  Test Sentry
</button>
```

### Verify in Development

1. Set `VITE_SENTRY_DEBUG=true` in `.env`
2. Trigger an error
3. Check Sentry dashboard

---

## 🚀 Production Deployment

### Vercel

Add environment variables in Vercel dashboard:

```
VITE_SENTRY_DSN=your_dsn_here
VITE_APP_VERSION=1.0.0
```

### Other Platforms

Add the same environment variables to your deployment platform.

---

## 📈 Performance Impact

**Bundle Size**: ~50KB gzipped  
**Performance**: Minimal (<1ms overhead)  
**Sample Rates**:

- Errors: 100%
- Performance: 10% (production)
- Replays: 10% (normal), 100% (errors)

---

## 🔧 Troubleshooting

### Errors Not Appearing

1. Check DSN is correct
2. Verify environment variables
3. Check `beforeSend` filter
4. Ensure production build

### Too Many Events

Adjust sample rates in `src/lib/sentry.ts`:

```typescript
tracesSampleRate: 0.05, // 5% instead of 10%
replaysSessionSampleRate: 0.05, // 5% instead of 10%
```

### Source Maps

For better stack traces, upload source maps:

```bash
npx @sentry/wizard@latest
```

---

## 📚 Resources

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring](https://docs.sentry.io/platforms/javascript/performance/)
- [Session Replay](https://docs.sentry.io/platforms/javascript/session-replay/)

---

## ✅ Checklist

- [ ] Create Sentry account
- [ ] Create React project
- [ ] Copy DSN
- [ ] Add to `.env`
- [ ] Test error capture
- [ ] Configure alerts
- [ ] Add to production deployment
- [ ] Upload source maps (optional)

---

**Status**: ✅ Configured and ready to use!
