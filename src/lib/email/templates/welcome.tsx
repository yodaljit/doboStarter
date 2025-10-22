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

interface WelcomeEmailProps {
  userName: string
  dashboardUrl: string
  teamName?: string
}

export const WelcomeEmail = ({
  userName = 'User',
  dashboardUrl = 'https://example.com/dashboard',
  teamName,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform!</Preview>
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
          <Heading style={h1}>Welcome to our platform, {userName}!</Heading>
          <Text style={text}>
            We're excited to have you on board. {teamName ? `You're now part of ${teamName}.` : 'Let\'s get you started.'}
          </Text>
          <Text style={text}>
            Here's what you can do next:
          </Text>
          <Section style={listContainer}>
            <Text style={listItem}>• Set up your profile</Text>
            <Text style={listItem}>• Explore your dashboard</Text>
            <Text style={listItem}>• Invite team members</Text>
            <Text style={listItem}>• Configure your settings</Text>
          </Section>
          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>
          <Text style={text}>
            If you have any questions, feel free to reply to this email or check out our{' '}
            <Link href="https://your-domain.com/help" style={link}>
              help center
            </Link>
            .
          </Text>
          <Text style={footer}>
            Welcome aboard!<br />
            The Team
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
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
}

const listContainer = {
  margin: '20px 0',
}

const listItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '8px 0',
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

export default WelcomeEmail