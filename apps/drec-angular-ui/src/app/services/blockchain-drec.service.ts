import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BlockchainProperties } from '../models/blockchain-properties.model';
import { OrganizationInformation } from '../models/organization.model';

@Injectable({
  providedIn: 'root'
})
export class BlockchainDrecService {

  constructor(private httpClient:HttpClient) { }


  getBlockchainProperties():Observable<BlockchainProperties>
  {
    return this.httpClient.get<BlockchainProperties>(environment.API_URL+'blockchain-properties')
  }
}
