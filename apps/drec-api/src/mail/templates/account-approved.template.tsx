import { Heading, Text, Link } from '@react-email/components';
import * as React from 'react';
import DefaultMailLayout from '../layouts/default.layout';

type AccountApprovedProps = Readonly<{
  firstName: string;
  loginUrl: string;
}>;

export default function AccountApproved({
  firstName,
  loginUrl,
}: AccountApprovedProps): React.JSX.Element {
  return (
    <DefaultMailLayout>
      <Heading as="h2">Account Approved</Heading>
      <Text>Dear {firstName},</Text>
      <Text>
        Your D-REC platform account has been reviewed and approved. You can now
        log in and start using the platform.
      </Text>
      <Link href={loginUrl} style={{ color: '#1F3864', fontWeight: 'bold' }}>
        Log in to the D-REC platform
      </Link>
    </DefaultMailLayout>
  );
}
