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
    name: 'Blockchain Properties',
    description: 'Endpoints related to blockchain properties',
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
  {
    name: 'Permissions',
    description:
      'Endpoints related to managing permissions within the application. This includes functionalities for assigning, updating, and retrieving permissions for users and roles. These operations ensure that access control is effectively managed, allowing for secure and organized user interactions within the system.',
  },
  {
    name: 'ACL Modules',
    description:
      'Endpoints related to managing ACL modules within the application. This includes functionalities for creating, updating, and retrieving ACL modules, ensuring that access control layers are effectively managed and organized within the system.',
  },
  {
    name: 'Device',
    description:
      'Endpoints related to device management. This includes functionalities for creating, updating, retrieving, and deleting devices, as well as managing device types and their associated data. These endpoints facilitate the organization and management of devices within the application, ensuring that device-related operations are streamlined and accessible for developers.',
  },
  {
    name: 'Buyer Reservation',
    description:
      'Endpoints related to managing buyer reservations, including creating new reservations, updating existing reservations, retrieving current reservation information, ending reservations, and fetching reservation logs. These endpoints facilitate the management of buyer interactions with reservations, ensuring that users can effectively handle their reservation data and maintain accurate records.',
  },
  {
    name: 'Country List',
    description:
      'Endpoint to get country codes. This allow retrieving a list of all country codes. These endpoints are essential for applications that require localization or internationalization, allowing users to obtain standardized country codes for various purposes, such as displaying country names or validating user input related to geographical locations.',
  },
  {
    name: 'Yield Configuration',
    description:
      'Endpoints related to managing yield configurations for countries. This includes functionalities for retrieving all yield values, adding new yield values, and updating existing yield configurations. These endpoints are crucial for applications that require accurate yield data for various countries.',
  },
  {
    name: 'Bulk Upload',
    description:
      'Endpoints related to bulk upload operations, including uploading bulk data files for processing and retrieving the status of bulk upload jobs. These endpoints facilitate efficient data management and integration for organizations, allowing for streamlined processing of large datasets.',
  },
  {
    name: 'Meter Reads',
    description:
      'Endpoints related to managing meter reads. This includes functionalities for retrieving time-series data of meter reads, adding new meter reads, and accessing the latest meter read for devices. These endpoints are essential for monitoring and analyzing energy consumption data.',
  },
  {
    name: 'Issue',
    description:
      'Endpoints related to the Issuer functionality. This includes functionalities for triggering ongoing and historical certificate issuance processes, re-issuing certificates for failed data, and handling late or missed issuance cycles. These endpoints are critical for managing the issuance of Distributed Renewable Energy Certificates (DRECs) and ensuring the integrity and timeliness of the issuance process.',
  },
  {
    name: 'Certificate Log',
    description:
      'Endpoints related to certificate management. This includes functionalities for retrieving certificate logs, generating certificates, managing certificate issuance, and exporting certificate data. These endpoints are essential for tracking and managing certificates issued for energy generation and consumption, ensuring transparency and compliance with regulatory requirements.',
  },
  {
    name: 'Admin',
    description:
      'Endpoints related to administrative operations. This includes functionalities for managing users, organizations, devices, and API users. It also covers tasks such as seeding data, registering devices in I-REC, and retrieving autocomplete suggestions for devices. These endpoints are restricted to a user with administrative roles and provide comprehensive tools for managing the system at a high level.',
  },
  {
    name: 'Sdg Benefit',
    description:
      'Endpoints related to managing Sustainable Development Goals (SDG) benefits. This includes functionalities for adding SDG benefits, retrieving a list of all SDG benefits, and fetching predefined SDG benefit codes and names. These endpoints are essential for tracking and managing SDG-related data within the system.',
  },
  {
    name: 'Health',
    description:
      "Endpoints related to checking the health and status of the application and it's related services",
  },
];

export default tags;
