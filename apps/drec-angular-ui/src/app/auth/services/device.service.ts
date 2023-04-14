import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import {environment} from '../../../environments/environment.dev';
// import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  url: String = environment.API_URL;
  constructor(private httpClient: HttpClient) { }
  GetMyDevices() : Observable<any>{
    return this.httpClient.get(this.url+'device/my')
  }
  GetDevicesInfo(id:number) : Observable<any>{
    return this.httpClient.get(this.url+'device/'+id)
  }
  getDeviceInfoBYexternalId(externalid:string) : Observable<any>{
    return this.httpClient.get(this.url+'device/externalId/'+externalid)
  }
  public Postdevices( data: any): Observable<any> {
    return this.httpClient.post<any>(this.url + 'device', data)

  }
  public Patchdevices( id:any,data: any): Observable<any> {
    return this.httpClient.patch<any>(this.url + 'device/'+id, data)

  }

  GetUnreserveDevices() : Observable<any>{
    return this.httpClient.get(this.url+'device/ungrouped/buyerreservation')
  }
  getfilterData(searchData:any): Observable<any> {
    //    return this.http.get(`${environment.BlueNumberGlobalAPI}/api/v1/Organization/search/paged`, { params: params, observe: 'response' });
    let searchUrl = `${this.url}device/ungrouped/buyerreservation?`;

    if (!(typeof searchData.countryCode === "undefined" || searchData.countryCode === ""||searchData.countryCode === null)) {
      searchUrl += `country=${searchData.countryCode}`;
    }

    if (!(typeof searchData.fuelCode === "undefined" || searchData.fuelCode === ""||searchData.fuelCode === null)) {
      searchUrl += `&fuelCode=${searchData.fuelCode}`;
      
    }

    // if (!(typeof searchData.Distance === "undefined" || searchData.Distance === ""))
    // {
    //   searchUrl+=`&Distance=${searchData.Distance}`;
    // }

    if (!(typeof searchData.deviceTypeCode === "undefined" || searchData.deviceTypeCode === ""||searchData.deviceTypeCode === null)) {
      searchUrl += `&deviceTypeCode=${searchData.deviceTypeCode}`;
    }

    if (!(typeof searchData.capacity === "undefined" || searchData.capacity === ""||searchData.capacity === null)) {
      searchUrl += `&capacity=${searchData.capacity}`;
    }
    if (!(typeof searchData.offTaker === "undefined" || searchData.offTaker === ""||searchData.offTaker === null)) {
      searchUrl += `&offTaker=${searchData.capacity}`;
    }
    // if (!(typeof searchData.GroupId === "undefined" || searchData.GroupId === "")) {
    //   searchUrl += `&GroupId=${searchData.GroupId}`;
    // }
    return this.httpClient.get(searchUrl);
  }

}
