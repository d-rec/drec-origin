import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OrganizationModule } from '../../view/organization/organization.module';

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
