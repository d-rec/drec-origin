import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material/material.module';
import { AuthInterceptor } from './auth/auth.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HeaderComponent } from './nav/header/header.component';
import { FooterComponent } from './nav/footer/footer.component';
import { SidemenuComponent } from './nav/sidemenu/sidemenu.component';
import { LoginComponent } from './view/login/login.component';
import { RegisterComponent } from './view/register/register.component';
import { CertificateComponent } from './view/certificate/certificate.component';
import { MyreservationComponent } from './view/myreservation/myreservation.component';
import { CertificateDetailsComponent } from './view/certificate-details/certificate-details.component';
import { WithloginlayoutComponent } from './nav/withloginlayout/withloginlayout.component';
import { WithoutloginlayoutComponent } from './nav/withoutloginlayout/withoutloginlayout.component';
import { RedemptionReportComponent } from './view/redemption-report/redemption-report.component';

import { AddReservationComponent } from './view/add-reservation/add-reservation.component';
import { CertifiedDevicesDeveloperComponent } from './view/certified-devices-developer/certified-devices-developer.component';
//import { TimezonePipe } from './utils/timezone.pipe';
import { PipesModule } from './pipes.module';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    SidemenuComponent,
    LoginComponent,
    RegisterComponent,
    CertificateComponent,
    MyreservationComponent,
    CertificateDetailsComponent,
    WithloginlayoutComponent,
    WithoutloginlayoutComponent,
    RedemptionReportComponent,
    // AddreadComponent,
    AddReservationComponent,

    CertifiedDevicesDeveloperComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    PipesModule,
    ToastrModule.forRoot({
      closeButton: true,
      timeOut: 15000, // 15 seconds
      progressBar: true,
    }),
   
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },],
  bootstrap: [AppComponent]
})
export class AppModule { }
