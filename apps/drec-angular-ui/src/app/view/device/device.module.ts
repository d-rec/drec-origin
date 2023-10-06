import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { DeviceRoutingModule } from './device-routing.module';
import { AlldevicesComponent } from './alldevices/alldevices.component';
import { AddDevicesComponent } from './add-devices/add-devices.component';
import { AddBulkDeviceComponent } from './add-bulk-device/add-bulk-device.component';
import { EditDeviceComponent } from './edit-device/edit-device.component';
@NgModule({
  declarations: [AlldevicesComponent,
    AddDevicesComponent,
    AddBulkDeviceComponent,
    EditDeviceComponent
  ],
  imports: [
    CommonModule,
    DeviceRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class DeviceModule { }
