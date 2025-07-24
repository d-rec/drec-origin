import {
  Body,
  Container,
  Head,
  Html,
  Section,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';

type DefaultMailLayoutProps = {
  language?: string | undefined;
  children: React.ReactNode;
  logInURL?: string;
};

export default function DefaultMailLayout({
  language = 'en',
  children,
  logInURL = process.env.UI_BASE_URL,
}: DefaultMailLayoutProps): React.JSX.Element {
  return (
    <Html lang={language}>
      <Head>
        <style>{/* Your custom styles here */}</style>
      </Head>
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Section>
          <Container>
            {children}
            <Button
              style={{
                backgroundColor: '#2557d3',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '5px',
              }}
              href={logInURL}
            >
              Log In to Your Account
            </Button>
            <Text>
              Best regards, <br />
              D-REC Team
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
