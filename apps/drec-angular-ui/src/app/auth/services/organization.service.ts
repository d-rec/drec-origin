import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrganizationInformation } from '../models/organization.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  constructor(private httpClient:HttpClient) { }


  getOrganizationInformation():Observable<OrganizationModule>
  {
    return this.httpClient.get<OrganizationModule>(environment.API_URL+'Organization/me')
  }
}
