import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MaterialModule} from '../../material/material.module';
import { OrganizationRoutingModule } from './organization-routing.module';
import { InformationComponent } from './information/information.component';


@NgModule({
  declarations: [
    InformationComponent
  ],
  imports: [
    CommonModule,
    OrganizationRoutingModule,
    MaterialModule
  ]
})
export class OrganizationModule { }
