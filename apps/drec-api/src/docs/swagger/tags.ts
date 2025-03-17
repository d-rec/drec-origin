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
];

export default tags;
