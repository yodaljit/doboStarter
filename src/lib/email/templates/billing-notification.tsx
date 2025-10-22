import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface BillingNotificationEmailProps {
  userName: string
  teamName: string
  type: 'payment_success' | 'payment_failed' | 'subscription_cancelled' | 'trial_ending'
  amount?: string
  nextBillingDate?: string
  billingUrl: string
}

export const BillingNotificationEmail = ({
  userName = 'User',
  teamName = 'Your Team',
  type = 'payment_success',
  amount,
  nextBillingDate,
  billingUrl = 'https://example.com/billing',
}: BillingNotificationEmailProps) => {
  const getSubject = () => {
    switch (type) {
      case 'payment_success':
        return 'Payment Successful'
      case 'payment_failed':
        return 'Payment Failed - Action Required'
      case 'subscription_cancelled':
        return 'Subscription Cancelled'
      case 'trial_ending':
        return 'Trial Ending Soon'
      default:
        return 'Billing Update'
    }
  }

  const getHeading = () => {
    switch (type) {
      case 'payment_success':
        return 'Payment Successful!'
      case 'payment_failed':
        return 'Payment Failed'
      case 'subscription_cancelled':
        return 'Subscription Cancelled'
      case 'trial_ending':
        return 'Your Trial is Ending Soon'
      default:
        return 'Billing Update'
    }
  }

  const getMessage = () => {
    switch (type) {
      case 'payment_success':
        return `Your payment of ${amount} for ${teamName} has been processed successfully. Your subscription is active and will renew on ${nextBillingDate}.`
      case 'payment_failed':
        return `We were unable to process your payment for ${teamName}. Please update your payment method to avoid service interruption.`
      case 'subscription_cancelled':
        return `Your subscription for ${teamName} has been cancelled. You'll continue to have access until your current billing period ends.`
      case 'trial_ending':
        return `Your trial for ${teamName} will end in 3 days. Upgrade now to continue using all features.`
      default:
        return 'There has been an update to your billing.'
    }
  }

  const getButtonText = () => {
    switch (type) {
      case 'payment_success':
        return 'View Invoice'
      case 'payment_failed':
        return 'Update Payment Method'
      case 'subscription_cancelled':
        return 'Reactivate Subscription'
      case 'trial_ending':
        return 'Upgrade Now'
      default:
        return 'Manage Billing'
    }
  }

  return (
    <Html>
      <Head />
      <Preview>{getSubject()}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://your-domain.com/logo.png"
              width="120"
              height="36"
              alt="Logo"
            />
          </Section>
          <Heading style={h1}>Hi {userName},</Heading>
          <Heading style={h2}>{getHeading()}</Heading>
          <Text style={text}>
            {getMessage()}
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={billingUrl}>
              {getButtonText()}
            </Button>
          </Section>
          <Text style={text}>
            You can manage your billing settings and view your invoices in your{' '}
            <Link href={billingUrl} style={link}>
              billing dashboard
            </Link>
            .
          </Text>
          <Text style={footer}>
            If you have any questions about your billing, please don't hesitate to contact our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const logoContainer = {
  marginBottom: '32px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px 0',
  padding: '0',
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#000',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
}

const link = {
  color: '#067df7',
  textDecoration: 'underline',
}

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
}

export default BillingNotificationEmail