jest.mock(
    '../../pods/evident/mail/evident-draft-device-registration.template',
    () => ({
      __esModule: true,
      default: () => null,
      getEvidentDraftDeviceRegistrationSubject: () => 'Mock subject',
    })
  );
  