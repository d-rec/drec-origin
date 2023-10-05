import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {InformationComponent} from './information/information.component'
const routes: Routes = [
  {
    path: '',
    redirectTo: 'information',
    pathMatch: 'full'
  },
  {
    path: 'information',
    component: InformationComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrganizationRoutingModule { }
