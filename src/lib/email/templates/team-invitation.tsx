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

interface TeamInvitationEmailProps {
  inviterName: string
  teamName: string
  inviteUrl: string
  role: string
  logoUrl?: string
  companyName?: string
}

export const TeamInvitationEmail = ({
  inviterName,
  teamName,
  inviteUrl,
  role,
  logoUrl,
  companyName,
}: TeamInvitationEmailProps) => {
  // Extract domain from invite URL for branding
  const domain = new URL(inviteUrl).hostname
  const displayCompanyName = companyName || teamName
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {teamName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Section style={logoContainer}>
              <Img
                src={logoUrl}
                width="120"
                height="36"
                alt={`${displayCompanyName} Logo`}
              />
            </Section>
          )}
          <Heading style={h1}>You're invited to join {teamName}</Heading>
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join <strong>{teamName}</strong> as a <strong>{role}</strong>.
          </Text>
          <Text style={text}>
            Click the button below to accept the invitation and create your account:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteUrl}>
              Accept Invitation & Create Account
            </Button>
          </Section>
          <Text style={text}>
            Or copy and paste this URL into your browser:{' '}
            <Link href={inviteUrl} style={link}>
              {inviteUrl}
            </Link>
          </Text>
          <Text style={footer}>
            This invitation was sent by {inviterName} from {teamName} via {domain}. If you weren't expecting this invitation, you can ignore this email.
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

export default TeamInvitationEmail