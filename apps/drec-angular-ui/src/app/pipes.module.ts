import { NgModule } from '@angular/core';
import { TimezonePipe } from './utils/timezone.pipe';

@NgModule({
  declarations: [TimezonePipe],
  exports: [TimezonePipe]
})
export class PipesModule {}