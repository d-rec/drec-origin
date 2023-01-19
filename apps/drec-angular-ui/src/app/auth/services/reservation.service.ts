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
}
