export enum ReadType {
  History = 'History',
  Delta = 'Delta',
  ReadMeter = 'Aggregate',
}

export enum ReadStatus {
  Done = 'Done',
  Pending = 'Pending',
}

export enum SingleDeviceIssuanceStatus {
  Requested = 'Requested',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
  Succeeded = 'Succeeded',
  Retry = 'Retry',
}
