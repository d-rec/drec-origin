import { mapMeterReads } from './lib/influx-db';

(async () => {
  try {
    const reads = await mapMeterReads();
    console.log('Meter Reads:', reads);
  } catch (error) {
    console.error('Error fetching meter reads:', error);
  }
})();