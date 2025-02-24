export const BullConfig = {
  queues: {
    reads: 'reads-queue',
    devices: 'device-queue',
  },
  jobNames: {
    readsBulkUpload: 'meter-reads-bulk-upload',
    deviceBulkUpload: 'device-bulk-upload',
  },
  jobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    delay: 1000,
  },
} as const;
