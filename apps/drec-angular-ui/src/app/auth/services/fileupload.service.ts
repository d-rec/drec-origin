import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class FileuploadService {
  private baseUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();

    formData.append('files', file);

    const req = new HttpRequest('POST', `${this.baseUrl}file`, formData, {
      reportProgress: true,
      responseType: 'json',
    });

    return this.http.request(req);
    

  }
  csvupload(file: File): Observable<HttpEvent<any>>{
  const formData: FormData = new FormData();

  formData.append('files', file);
    return this.http.post<any>(this.baseUrl+'file', formData)

  }
  addbulkDevices(data: any):Observable<any>{
    return this.http.post<any>(this.baseUrl+'device-group/process-creation-bulk-devices-csv', data)
  }
  getCsvJobList(): Observable<any> {
    return this.http.get(`${this.baseUrl}device-group/bulk-upload/get-all-csv-jobs-of-organization`);
  }
  getJobStatus(id:number): Observable<any> {
    return this.http.get(`${this.baseUrl}device-group/bulk-upload-status/`+id);
  }
}