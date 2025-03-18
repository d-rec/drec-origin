const tags: { name: string; description: string }[] = [
  {
    name: 'Auth',
    description:
      'All endpoints related to user authentication and authorization. It covers functionalities such as login, registration, token issuance and verification, password recovery, and session management. Endpoints under this tag are designed to secure the API by verifying user credentials, managing access tokens, and ensuring that only authenticated users can interact with protected resources. This separation helps developers quickly identify and integrate security-related operations within the API.',
  },
  {
    name: 'User',
    description:
      'All endpoints related to user management. This includes functionalities such as retrieving user profiles, updating user information, managing user passwords, confirming email addresses, and handling user registrations. Endpoints under this tag facilitate the management of user data and interactions, ensuring that user-related operations are organized and easily accessible for developers.',
  },
  {
    name: 'Organization',
    description:
      'All endpoints related to organization management. This includes functionalities such as retrieving organization details for the authenticated user, managing all organizations associated with an API user, fetching users within an organization, handling user role changes, managing invitations, and setting blockchain addresses. These endpoints ensure comprehensive management of organizational data and user interactions within the organization, providing a structured approach to organization-related operations.',
  },
];

export default tags;
