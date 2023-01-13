import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddDevicesComponent } from './add-devices/add-devices.component';
import { AlldevicesComponent } from './alldevices/alldevices.component';
const routes: Routes = [
  { path: '', redirectTo: 'AllList', pathMatch: 'full' },
  { path: 'AllList', component: AlldevicesComponent },
  { path: 'add', component: AddDevicesComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeviceRoutingModule { }
