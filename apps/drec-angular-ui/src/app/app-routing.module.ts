import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WithloginlayoutComponent } from './nav/withloginlayout/withloginlayout.component';
import { WithoutloginlayoutComponent } from './nav/withoutloginlayout/withoutloginlayout.component';
import { LoginComponent } from './view/login/login.component';
import { RegisterComponent } from './view/register/register.component';
import { CertificateComponent } from './view/certificate/certificate.component';
import {RedemptionReportComponent} from './view/redemption-report/redemption-report.component';

import {CertificateDetailsComponent} from './view/certificate-details/certificate-details.component'
import {
  MyreservationComponent
} from './view/myreservation/myreservation.component'
import {AddReservationComponent} from './view/add-reservation/add-reservation.component'
const routes: Routes = [


  { path: '', redirectTo: 'login', data: { title: 'First Component' }, pathMatch: 'full' },

  {
    path: '', component: WithoutloginlayoutComponent, data: { title: 'First Component' },
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
    ]
  },
  {
    path: '', component: WithloginlayoutComponent,
    children: [
      { path: '', redirectTo: 'device', pathMatch: 'full' },
    
      { path: 'All_certificate', component: CertificateDetailsComponent },
      { path: 'certificate', component: CertificateComponent },
      { path: 'myreservation', component: MyreservationComponent },
   
      {
        path: 'reads',
        loadChildren: () =>
          import('./view/meter-read/meter-read.module').then((m) => m.MeterReadModule),
      },
    //  { path: 'add/read', component: AddreadComponent },
      {
        path: 'organization',
        loadChildren: () =>
          import('./view/organization/organization.module').then((m) => m.OrganizationModule),
      },
      {
        path: 'device',
        loadChildren: () =>
          import('./view/device/device.module').then((m) => m.DeviceModule),
      },
      {
        path: 'redemption-report', component:RedemptionReportComponent
      },
      {
        path: 'add/reservation', component:AddReservationComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
