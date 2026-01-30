# Email System Setup with Resend

The email system is fully configured and ready to use with Resend.

## ✅ What's Already Done

### Backend Email Service
The following emails are **already implemented** and will send automatically:

#### Authentication & Onboarding
- ✅ **Email Verification** - Sent on signup
- ✅ **Password Reset** - Sent when user requests password reset
- ✅ **Welcome Email** - Sent after email verification

#### Bookings & Games
- ✅ **Booking Confirmation** - Master game bookings
- ✅ **Game Reminders** - Sent 24h before scheduled games
- ✅ **Game Updates** - When game details change

#### Tournaments
- ✅ **Tournament Registration Confirmation**
- ✅ **Tournament Reminder** - Sent 24-48h before tournament
- ✅ **Tournament Cancellation** - If tournament is cancelled
- ✅ **Tournament Updates** - Important changes

#### Clubs
- ✅ **Club Membership Confirmation**
- ✅ **New Club Notifications** - When clubs are created in your area

#### Challenges
- ✅ **Challenge Notifications** - When someone challenges you to a game

#### Verification
- ✅ **Identity Verification Approved**
- ✅ **Identity Verification Rejected**

### Automated Cron Jobs
The scheduler runs these email jobs automatically:

- **Hourly**: Process scheduled notifications
- **Every 6 hours**: Send game reminders
- **Daily at 1 AM**: Create recurring games
- **Daily at 2 AM**: Expire old waitlist entries
- **Daily at 3 AM**: Expire trials and send notifications

## ⚠️ Domain Verification Required

To send emails from `noreply@chessfam.com`, you need to verify your domain in Resend:

### Steps to Verify Domain:

1. **Go to Resend Dashboard**
   - https://resend.com/domains

2. **Add Domain**
   - Click "Add Domain"
   - Enter: `chessfam.com`

3. **Add DNS Records**
   Resend will give you DNS records to add. Add these to your domain registrar:
   
   **SPF Record** (TXT):
   ```
   v=spf1 include:_spf.resend.com ~all
   ```

   **DKIM Records** (TXT):
   Resend will provide specific DKIM records - add all of them

   **MX Record**:
   ```
   10 feedback-smtp.us-east-1.amazonses.com
   ```

4. **Wait for Verification**
   - DNS changes can take up to 48 hours
   - Resend will automatically verify once records propagate

### Temporary Solution (Testing)

While waiting for domain verification, you can use Resend's **testing address**:

In Railway, temporarily change:
```
EMAIL_FROM=onboarding@resend.dev
```

This allows you to test emails immediately, but they'll show "via resend.dev" to recipients.

## Environment Variables in Railway

Make sure these are set in your Railway backend service:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@chessfam.com
EMAIL_FROM_NAME=ChessFam
FRONTEND_URL=https://chessfam.com
```

## Testing the Email System

### 1. Test Email Verification
Sign up a new account - you should receive:
- Email verification email immediately
- Welcome email after clicking verification link

### 2. Test Password Reset
Click "Forgot Password" - you should receive:
- Password reset email with link

### 3. Test Tournament Registration
Register for a tournament - you should receive:
- Tournament registration confirmation email

### 4. Monitor Logs
Check Railway logs for email confirmations:
```
[Email] Sent to user@example.com: Email Verification
```

## Email Templates

All email templates are in:
- `backend/src/services/emailTemplates.ts`

Templates use:
- Professional HTML design
- Responsive layout
- Brand colors (purple/gold)
- Clear call-to-action buttons
- Plain text fallback

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**
   ```bash
   # In Railway logs, look for:
   [Email] Resend not configured
   ```

2. **Check Domain Verification**
   - Go to https://resend.com/domains
   - Ensure status is "Verified"

3. **Check Logs**
   - Railway logs will show: `[Email] Sent to...` for successful sends
   - Or: `[Email] Send error:` for failures

4. **Check Spam Folder**
   - Especially before domain verification

### Domain Not Verified Yet

**Temporary Fix**: Use Resend's test address
```
EMAIL_FROM=onboarding@resend.dev
```

**Permanent Fix**: Complete domain verification (see above)

## Cost & Limits

Resend Free Tier:
- 100 emails/day
- 3,000 emails/month

This should be sufficient for initial usage. Monitor usage at:
https://resend.com/overview

## Next Steps

1. ✅ Added RESEND_API_KEY to Railway
2. ✅ Email system already implemented
3. 🔄 Verify domain in Resend dashboard
4. 🔄 Test signup flow to verify emails work
5. 🔄 Monitor Railway logs for email confirmations

## Notes

- Emails are **only sent in production** when RESEND_API_KEY is set
- In development, emails are logged to console (not sent)
- All templates include unsubscribe links (for notification preferences)
- Users can manage email preferences from their profile

---

**The email system is production-ready!** Just verify your domain in Resend and you're all set. 🎉
