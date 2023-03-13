import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
//import {environment} from '../../environments/environment.dev';
import { environment } from '../../../environments/environment';
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
}
