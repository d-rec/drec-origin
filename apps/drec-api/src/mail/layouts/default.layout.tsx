import {
  Body,
  Container,
  Head,
  Html,
  Section,
  Text,
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
