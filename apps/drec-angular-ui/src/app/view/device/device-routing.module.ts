import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddDevicesComponent } from './add-devices/add-devices.component';
import { AlldevicesComponent } from './alldevices/alldevices.component';
import {AddBulkDeviceComponent} from './add-bulk-device/add-bulk-device.component';
import {EditDeviceComponent} from './edit-device/edit-device.component'
const routes: Routes = [
  { path: '', redirectTo: 'AllList', pathMatch: 'full' },
  { path: 'AllList', component: AlldevicesComponent },
  { path: 'add', component: AddDevicesComponent },
  { path: 'bulk_upload', component: AddBulkDeviceComponent },
  { path: 'edit', component: EditDeviceComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeviceRoutingModule { }
