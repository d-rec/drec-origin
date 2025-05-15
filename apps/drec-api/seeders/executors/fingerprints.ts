import { SeederExecutor } from "../core/seeder-executor";
import { FingerprintSeeder } from "../fixtures/fingerprint.seeder";


SeederExecutor.run([
  FingerprintSeeder,
]);
