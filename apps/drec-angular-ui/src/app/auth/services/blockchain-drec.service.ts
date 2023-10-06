import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrganizationInformation } from '../../models/organization.model';
import { BlockchainProperties } from '../../models/blockchain-properties.model';


@Injectable({
  providedIn: 'root'
})
export class BlockchainDrecService {

  constructor(private httpClient:HttpClient) { }


  getBlockchainProperties():Observable<BlockchainProperties>
  {
    return this.httpClient.get<BlockchainProperties>(environment.API_URL+'blockchain-properties')
  }

  convertClaimAmountToHex(amount:number|string):Observable<any>
  {
    return this.httpClient.get<any>(environment.API_URL+`certificate-log/claim-amount-in-ethers-json?amount=${amount.toString()}`)
  }
  
}
