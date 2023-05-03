import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
//import {environment} from '../../environments/environment.dev';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  url: String = environment.API_URL;
  constructor(private httpClient: HttpClient) { }
  GetMethod() : Observable<any>{
    return this.httpClient.get(this.url+'certificate-log/redemption-report')
  }
  // requestAllOrganizationsBluenumberInfoWithJobId(jobId: string): Observable<any> {
  //   return this.http.get(`${environment.BlueNumberGlobalAPI}/api/v1/Organization/Job/${jobId}`);
  // }

  getReservationData(searchData:any): Observable<any> {
    //    return this.http.get(`${environment.BlueNumberGlobalAPI}/api/v1/Organization/search/paged`, { params: params, observe: 'response' });
    let searchUrl = `${this.url}device-group/my?`;

    if (!(typeof searchData.countryCode === "undefined" || searchData.countryCode === ""||searchData.countryCode === null)) {
      searchUrl += `country=${searchData.countryCode}`;
    }

    if (!(typeof searchData.fuelCode === "undefined" || searchData.fuelCode === ""||searchData.fuelCode === null)) {
      searchUrl += `&fuelCode=${searchData.fuelCode}`;
      
    }
    if (!(typeof searchData.offTaker === "undefined" || searchData.offTaker === ""||searchData.offTaker === null)) {
      searchUrl += `&offTaker=${searchData.offTaker}`;
    }
    if (!(typeof searchData.SDGBenefits === "undefined" || searchData.SDGBenefits === ""||searchData.SDGBenefits === null))
    {
      searchUrl+=`&sdgbenefit=${searchData.SDGBenefits}`;
    }

    if (!(typeof searchData.reservationStartDate === "undefined" || searchData.reservationStartDate === ""||searchData.reservationStartDate === null)) {
      searchUrl += `&start_date=${new Date(searchData.reservationStartDate).toISOString()}`;
    }

    if (!(typeof searchData.reservationEndDate === "undefined" || searchData.reservationEndDate === ""||searchData.reservationEndDate === null)) {
      searchUrl += `&end_date=${new Date(searchData.reservationEndDate).toISOString()}`;
    }
    
    // if (!(typeof searchData.GroupId === "undefined" || searchData.GroupId === "")) {
    //   searchUrl += `&GroupId=${searchData.GroupId}`;
    // }
    return this.httpClient.get(searchUrl);
  }
}
