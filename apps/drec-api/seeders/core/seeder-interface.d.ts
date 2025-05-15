export interface SeederInterface {
  /**
   * Run the the seeder.
   */
  run(): Promise<any>;
  /**
   * Reverse the seeder.
   */
  drop(): Promise<any>;
}
