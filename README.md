# SaaS Foundation

A modern, full-stack SaaS foundation built with Next.js, Supabase, and Stripe. This project provides a complete starting point for building multi-tenant SaaS applications with authentication, team management, subscription billing, and email notifications.

## 🚀 Features

### Core Features
- **Multi-tenant Architecture**: Teams and subaccounts with role-based access control
- **Authentication**: Email/password and OAuth (Google) via Supabase Auth
- **Subscription Management**: Stripe integration with multiple pricing tiers
- **Email Notifications**: Team invitations and notifications via Resend
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

### Authentication & Authorization
- User registration and login
- Email verification
- OAuth providers (Google)
- Role-based access control (Owner, Admin, Member)
- Protected routes with middleware

### Team Management
- Create and manage teams
- Team member invitations with email notifications
- Role assignments
- Team switching
- Team-specific data isolation

### Billing & Subscriptions
- Stripe Checkout integration
- Multiple subscription plans (Free, Pro, Enterprise)
- Webhook handling for subscription events
- Billing portal access
- Usage-based restrictions

### Dashboard
- Team overview and statistics
- Subscription status
- Team management interface
- Billing management

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: Resend with React Email templates
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI with custom styling
- **TypeScript**: Full type safety
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before you begin, ensure you have the following installed and set up:

### Required Software
- **Node.js**: Version 18.17.0 or higher ([Download](https://nodejs.org/))
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))

### Required Accounts
- **Supabase Account**: [Sign up at supabase.com](https://supabase.com/)
- **Stripe Account**: [Sign up at stripe.com](https://stripe.com/)
- **Resend Account**: [Sign up at resend.com](https://resend.com/)
- **Google Cloud Console** (optional, for OAuth): [console.cloud.google.com](https://console.cloud.google.com/)

### Verify Installation
```bash
node --version  # Should be 18.17.0+
npm --version   # Should be 9.0.0+
git --version   # Should show git version
```

## 🚀 Complete Setup Guide

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd sasser

# Install dependencies
npm install
```

### Step 2: Supabase Setup

#### 2.1 Create a Supabase Project
1. Go to [supabase.com](https://supabase.com/) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: Your project name (e.g., "my-saas-app")
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

#### 2.2 Get Supabase Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)
   - **Service role key** (starts with `eyJ`) - Keep this secret!

#### 2.3 Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute the schema
6. Verify tables were created in **Database** → **Tables**

#### 2.4 Configure Authentication
1. Go to **Authentication** → **Settings**
2. Set **Site URL** to: `http://localhost:3000`
3. Add **Redirect URLs**:
   - `http://localhost:3000/api/auth/callback`
   - `https://yourdomain.com/api/auth/callback` (for production)

#### 2.5 Enable Google OAuth (Optional)
1. Go to **Authentication** → **Providers**
2. Find "Google" and click the toggle to enable
3. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
   - Set **Authorized redirect URIs** to your Supabase auth callback URL
   - Copy **Client ID** and **Client Secret** to Supabase

### Step 3: Stripe Setup

#### 3.1 Create Stripe Account
1. Go to [stripe.com](https://stripe.com/) and sign up
2. Complete account verification
3. Switch to **Test mode** for development

#### 3.2 Get Stripe API Keys
1. In Stripe dashboard, go to **Developers** → **API keys**
2. Copy the following:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Keep this secret!

#### 3.3 Create Products and Prices
1. Go to **Products** → **Add product**
2. Create three products:

**Free Plan**
- Name: "Free"
- Description: "Basic features for getting started"
- Pricing: $0/month (one-time or recurring)

**Pro Plan**
- Name: "Pro"
- Description: "Advanced features for growing teams"
- Pricing: $29/month (recurring)

**Enterprise Plan**
- Name: "Enterprise"
- Description: "Full features for large organizations"
- Pricing: $99/month (recurring)

3. Copy the **Price IDs** (start with `price_`) for each plan

#### 3.4 Set Up Webhooks
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set **Endpoint URL** to: `http://localhost:3000/api/webhooks/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Webhook signing secret** (starts with `whsec_`)

### Step 4: Resend Email Setup

#### 4.1 Create Resend Account
1. Go to [resend.com](https://resend.com/) and sign up
2. Verify your email address

#### 4.2 Get API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it (e.g., "SaaS App Development")
4. Copy the API key (starts with `re_`)

#### 4.3 Set Up Domain (Optional for Production)
1. Go to **Domains** → **Add Domain**
2. Enter your domain name
3. Follow DNS setup instructions
4. For development, you can use the default domain

### Step 5: Environment Configuration

Create a `.env.local` file in the root directory with all your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration (Resend)
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 6: Update Stripe Price IDs

1. Open `src/app/dashboard/billing/page.tsx`
2. Find the subscription plans configuration
3. Replace the placeholder price IDs with your actual Stripe price IDs:

```typescript
const plans = [
  {
    name: "Free",
    price: "$0",
    priceId: "your_free_price_id", // Replace with actual price ID
    // ... other config
  },
  {
    name: "Pro",
    price: "$29",
    priceId: "your_pro_price_id", // Replace with actual price ID
    // ... other config
  },
  {
    name: "Enterprise",
    price: "$99",
    priceId: "your_enterprise_price_id", // Replace with actual price ID
    // ... other config
  }
];
```

### Step 7: Run the Application

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 8: Test the Setup

#### 8.1 Test Authentication
1. Go to `/auth/signup`
2. Create a new account
3. Check your email for verification
4. Log in successfully

#### 8.2 Test Team Creation
1. After login, you should automatically have a team
2. Go to team settings
3. Try inviting a team member
4. Check that invitation email is sent

#### 8.3 Test Stripe Integration
1. Go to billing page
2. Try subscribing to a plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Verify subscription is created

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── teams/         # Team management
│   │   ├── invitations/   # Team invitation handling
│   │   ├── subscriptions/ # Stripe checkout
│   │   └── webhooks/      # Stripe webhooks
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard pages
│   ├── invite/            # Invitation acceptance pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   ├── teams/            # Team management components
│   └── ui/               # UI primitives
├── lib/                  # Utilities and configurations
│   ├── auth/             # Authentication context
│   ├── email/            # Email templates and service
│   ├── notifications/    # Notification service
│   ├── stripe/           # Stripe configuration
│   └── supabase/         # Supabase client
├── middleware.ts         # Route protection
└── types/               # TypeScript type definitions
```

## 🔐 Authentication Flow

1. **Sign Up**: Users create accounts with email/password or OAuth
2. **Email Verification**: Email-based signups require verification
3. **Team Creation**: New users automatically get a personal team
4. **Role Assignment**: Team creators become owners with full permissions
5. **Protected Routes**: Middleware protects dashboard routes

## 👥 Team Management

### Roles and Permissions

- **Owner**: Full access, can manage billing, delete team
- **Admin**: Can manage team members and settings
- **Member**: Basic access to team resources

### Team Operations

- Create teams with unique slugs
- Invite members via email with React Email templates
- Assign roles to team members
- Switch between teams
- Manage team settings

### Invitation Flow

1. Team owner/admin enters email address
2. System creates invitation record
3. Email sent via Resend with invitation link
4. Recipient clicks link and sets password
5. User automatically added to team

## 💳 Subscription Management

### Plans

- **Free**: Basic features, limited usage
- **Pro**: Advanced features, higher limits
- **Enterprise**: Full features, unlimited usage

### Billing Flow

1. User selects a plan
2. Stripe Checkout session created
3. Payment processed by Stripe
4. Webhook updates subscription status
5. User gains access to plan features

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Update these URLs for production:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
FROM_EMAIL=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
```

### Post-Deployment Setup

1. Update Supabase redirect URLs to include production domain
2. Update Stripe webhook endpoints to production URL
3. Set up custom domain in Resend (optional)
4. Test all flows in production environment

## 🧪 Testing

### Complete Testing Checklist

#### Authentication
- [ ] User registration with email/password
- [ ] Email verification process
- [ ] User login/logout
- [ ] OAuth authentication (if enabled)
- [ ] Password reset functionality

#### Team Management
- [ ] Automatic team creation for new users
- [ ] Team member invitation flow
- [ ] Email delivery for invitations
- [ ] Invitation acceptance and password setup
- [ ] Role assignment and permissions
- [ ] Team switching functionality

#### Billing & Subscriptions
- [ ] Subscription plan selection
- [ ] Stripe Checkout process
- [ ] Webhook event processing
- [ ] Subscription status updates
- [ ] Billing portal access

#### Email System
- [ ] Team invitation emails sent
- [ ] Email templates render correctly
- [ ] Dynamic content (team name, inviter, etc.)
- [ ] Email delivery via Resend

### Test Data

Use these test credentials for Stripe:

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

## 🔧 Troubleshooting

### Common Setup Issues

#### Supabase Connection Issues
**Problem**: "Invalid API key" or connection errors
**Solutions**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the anon key, not service role
- Ensure no extra spaces in environment variables
- Restart development server after changing env vars

#### Database Schema Issues
**Problem**: Tables don't exist or RLS errors
**Solutions**:
- Re-run the schema.sql file in Supabase SQL Editor
- Check that all tables were created in Database → Tables
- Verify RLS policies are enabled
- Ensure service role key has proper permissions

#### Authentication Not Working
**Problem**: Login/signup fails or redirects incorrectly
**Solutions**:
- Check Site URL in Supabase Auth settings
- Verify redirect URLs include `/api/auth/callback`
- Clear browser cache and cookies
- Check middleware.ts is properly configured

#### Stripe Payment Issues
**Problem**: Checkout fails or webhooks not working
**Solutions**:
- Verify Stripe keys match the mode (test vs live)
- Check webhook endpoint URL is accessible
- Ensure webhook secret is correct
- Test with Stripe CLI for local development:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

#### Email Delivery Issues
**Problem**: Invitation emails not sent
**Solutions**:
- Verify Resend API key is correct
- Check FROM_EMAIL is verified in Resend
- Look for errors in server logs
- Test email delivery in Resend dashboard

#### Environment Variable Issues
**Problem**: Variables not loading or undefined
**Solutions**:
- Ensure `.env.local` is in root directory
- Check variable names match exactly (case-sensitive)
- Restart development server after changes
- Verify no quotes around values unless needed

### Development Tips

1. **Use Stripe CLI** for local webhook testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **Check Supabase logs** for database errors:
   - Go to Supabase Dashboard → Logs

3. **Monitor email delivery** in Resend dashboard:
   - Check delivery status and any bounce/complaint reports

4. **Use browser dev tools** to check for console errors

5. **Test with different browsers** to rule out browser-specific issues

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Support

If you encounter issues during setup:

1. Check the troubleshooting section above
2. Review the documentation links
3. Check GitHub issues for similar problems
4. Create a new issue with detailed error messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
