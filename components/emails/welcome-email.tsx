import { Body, Button, Head, Heading, Html, Preview, Text } from "@react-email/components"
import EmailLayout from "./email-layout"

interface WelcomeEmailProps {
  userName: string | null
  logoUrl?: string
}

export default function WelcomeEmail({ userName, logoUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bienvenue sur Louer-Ici !</Preview>
      <Body style={main}>
        <EmailLayout logoUrl={logoUrl}>
          <Heading style={h1}>Bienvenue sur Louer-Ici, {userName || "cher utilisateur"} !</Heading>
          <Text style={text}>
            Nous sommes ravis de vous compter parmi nous. Vous pouvez désormais explorer des biens, soumettre vos
            candidatures et gérer vos locations en toute simplicité.
          </Text>
          <Button style={button} href={process.env.NEXT_PUBLIC_SITE_URL || "https://rental-platform-h5sj.vercel.app"}>
            Commencer
          </Button>
        </EmailLayout>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  padding: "20px",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "20px",
}

const text = {
  color: "#555",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "20px",
}

const button = {
  backgroundColor: "#007bff",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  marginTop: "10px",
}
