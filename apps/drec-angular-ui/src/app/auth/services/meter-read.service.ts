import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
//import {environment} from '../../environments/environment.dev';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class MeterReadService {
  url: String = environment.API_URL;
  constructor(private httpClient: HttpClient) { }
  GetMethod() : Observable<any>{
    return this.httpClient.get(this.url+'certificate-log/redemption-report')
  }
  PostRead(exterenalId:string,data: any): Observable<any> {
    return this.httpClient.post<any>(this.url + 'meter-reads/new/'+exterenalId, data)

  }
  GetRead(exterenalId:string,data: any): Observable<any> {
    console.log(data)
   // return this.httpClient.get<any>(this.url + 'meter-reads/new/'+exterenalId+'? data)
   let searchUrl = `${this.url}meter-reads/new/`+exterenalId+`?readType=meterReads&`;

   if (!(typeof data.start === "undefined" || data.start === ""||data.start === null)) {
     searchUrl += `start=${new Date(data.start).toISOString()}`;
   }

   if (!(typeof data.end === "undefined" || data.end === ""||data.end === null)) {
     searchUrl += `&end=${new Date(data.end).toISOString()}`;
     
   }

   // if (!(typeof searchData.Distance === "undefined" || searchData.Distance === ""))
   // {
   //   searchUrl+=`&Distance=${searchData.Distance}`;
   // }

   if (!(typeof data.pagenumber === "undefined" || data.pagenumber === ""||data.pagenumber === null)) {
     searchUrl += `&pagenumber=${data.pagenumber}`;
   }

   // if (!(typeof searchData.GroupId === "undefined" || searchData.GroupId === "")) {
   //   searchUrl += `&GroupId=${searchData.GroupId}`;
   // }
   return this.httpClient.get(searchUrl);
  }
  Getlastread(exterenalId:string): Observable<any> {
    return this.httpClient.get(this.url+'meter-reads/latestread/'+exterenalId)
  }
}
