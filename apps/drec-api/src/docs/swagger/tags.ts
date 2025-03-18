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
  {
    name: 'blockchain-properties',
    description:'',
  },
  {
    name: 'File',
    description:
      'Endpoints for managing file operations, including uploading files to an AWS S3 bucket and downloading files. These operations ensure secure handling of files, allowing users to store and retrieve documents efficiently while maintaining proper authorization and validation mechanisms.',
  },
  {
    name: 'Invitation',
    description:
      'Endpoints related to managing invitations within organizations. This includes functionalities for inviting users to organizations, retrieving invitations, and managing invitation statuses. These operations ensure that organizations can effectively manage user access and collaboration while maintaining proper authorization and validation mechanisms.',
  },
];

export default tags;
