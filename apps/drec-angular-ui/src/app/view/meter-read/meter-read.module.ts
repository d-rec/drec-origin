import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MeterReadRoutingModule } from './meter-read-routing.module';
import {AddreadComponent} from './addread/addread.component'
import { AllMetereadsComponent } from './all-metereads/all-metereads.component';


@NgModule({
  declarations: [
    AllMetereadsComponent,AddreadComponent
  ],
  imports: [
    CommonModule,
    MeterReadRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class MeterReadModule { }
