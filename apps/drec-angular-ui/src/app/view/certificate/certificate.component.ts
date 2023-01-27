

import { FormBuilder } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MediaMatcher } from '@angular/cdk/layout';
import { Component, ViewChild, ViewChildren, QueryList, ChangeDetectorRef, OnInit } from '@angular/core';
// import { NavItem } from './nav-item';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { AuthbaseService } from '../../auth/authbase.service';
import { Router,ActivatedRoute, Params } from '@angular/router';
import {environment} from '../../../environments/environment';
import { BlockchainDrecService } from '../../auth/services/blockchain-drec.service';
import { BlockchainProperties } from '../../models/blockchain-properties.model';
import { ethers } from 'ethers';
import { ToastrService } from 'ngx-toastr';

import { issuerABI } from './issuer-abi';
import { registryABI } from './registery-abi';

export interface Student {
  firstName: string;
  lastName: string;
  studentEmail: string;
  course: string;
  yearOfStudy: number;

}
@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class CertificateComponent implements OnInit {


  displayedColumns = ['serialno','certificateStartDate', 'certificateEndDate','owners'];
   innerDisplayedColumns = ['certificate_issuance_startdate','certificate_issuance_enddate','deviceid', 'readvalue_watthour'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;
  data:any;
  group_uid: string;
  energyurl:any;
  group_name:any;
  
  constructor(private blockchainDRECService:BlockchainDrecService ,private authService: AuthbaseService, private router: Router, private activatedRoute: ActivatedRoute, private toastrService:ToastrService) {

    this.activatedRoute.queryParams.subscribe(params => {
      this.group_uid = params['id'];
      this.group_name = params['name'];
     
  });
   }
  ngOnInit() {
    this.energyurl=environment.Explorer_URL+'/block/';
    console.log("myreservation");
    this.DisplayList()
    this.getBlockchainProperties();
  }
  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  //   this.dataSource.sort = this.sort;
  // }

  blockchainProperties:BlockchainProperties;
  getBlockchainProperties()
  {
    this.blockchainDRECService.getBlockchainProperties().subscribe((response:BlockchainProperties)=>{
      this.blockchainProperties = response;
    })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  DisplayList() {
    this.authService.GetMethod('certificate-log/issuer/certified/'+this.group_uid).subscribe(
      (data) => {
        // display list in the console 
       
        this.data = data;
        //@ts-ignore
        this.data.forEach(ele=>{
          ele['generationStartTimeinUTC'] = new Date(ele.generationStartTime *1000).toISOString();
          ele['generationEndTimeinUTC'] = new Date(ele.generationEndTime *1000).toISOString();
          //converting blockchain address to lower case
          for(let key in ele.owners)
          {
            if(key !== key.toLowerCase())
            {
              ele.owners[key.toLowerCase()] = ele.owners[key];
              delete ele.owners[key];
            }
          }
          })
       // this.dataSource = new MatTableDataSource(this.data);
        //this.dataSource.paginator = this.paginator
        console.log(data);
        let deviceExternalIdinCertificates:any =[];
        //@ts-ignore
        this.data.forEach(ele=>{
            if(ele.perDeviceCertificateLog && ele.perDeviceCertificateLog.length> 0)
            {
              //@ts-ignore
                ele.perDeviceCertificateLog.forEach(ele=>{
                  //@ts-ignore
                    if(!deviceExternalIdinCertificates.find(de=>de===ele.deviceid))
                    {
                      this.authService.GetMethod('device/externalId/'+ele.deviceid).subscribe(
                        (data1) => {
                          console.log(data1);
                        deviceExternalIdinCertificates.push(ele.deviceid);
                      }

                      )
                    }
                })
            }
        })
      }

    )
  }

  getWindowEthereumObject()
  {
    //@ts-ignore
    return window.ethereum;
  }

  selectedCertificateForClaim:{
    id: number,
    deviceId: string, // groupId or reservation id
    generationStartTime: number,
    generationEndTime: number,
    owners:{[key:string]:string}
  }

  formattedClaimAmount:{
    hex:string,
    type:string
  }

  selectedBlockchainAccount:string='';

  checkMetamaskConnected()
  {
    return typeof window!=='undefined' && typeof this.getWindowEthereumObject() !== 'undefined'; 
  }

  connectWallet()
  {
  //@ts-ignore   
    if(typeof window!=='undefined' && typeof window.ethereum! == 'undefined')
    {
      try
      {
        //@ts-ignore
        window.ethereum.request({method:'eth_requestAccounts'})
      
      }
      catch(e)
      {
        console.error("some error occures",e);
      }
    }
  }

  selectAccountAddressFromMetamask()
  {
    //@ts-ignore
    if(typeof window !=='undefined' && typeof window.ethereum !== 'undefined')
    {
      //@ts-ignore
      window.ethereum.request({method:'eth_requestAccounts'}).then(response=>{
        this.selectedBlockchainAccount = (response && response[0]) ? response[0]:'';
        this.selectedBlockchainAccount = this.selectedBlockchainAccount.toLowerCase();
        if(this.selectedBlockchainAccount ==='' )
        {
          this.toastrService.error('No Blockchain account selected please connect metamask account')
        }
      })
    }
    else
    {
      this.toastrService.error('Metamask is not connected, please first connect metamask then click this button to select account');
    }
  }

  selectCertificateForClaim(certificate:any)
  {
    if(this.selectedBlockchainAccount === '')
    {
      this.toastrService.error('No account is connected currently, please connect metamask account'); 
      return;
    }
    this.selectedCertificateForClaim = certificate;
    this.getAmountForClaim(this.selectedBlockchainAccount);
  }
  getAmountForClaim(blockchainAccountAddress:string)
  {
    if(this.selectedCertificateForClaim.owners[blockchainAccountAddress] && parseFloat(this.selectedCertificateForClaim.owners[blockchainAccountAddress]) > 0)
    {
      let convertingWattsToKiloWatts = Math.floor(parseFloat(this.selectedCertificateForClaim.owners[blockchainAccountAddress])/1000);
      this.blockchainDRECService.convertClaimAmountToHex(convertingWattsToKiloWatts).subscribe(response=>{
        this.formattedClaimAmount = response;
        this.claimUsingEtherJS();
      },
      error=>{
        this.toastrService.error(`Some error occured while requesting for claim+ ${JSON.stringify(error)}`);
      })
    }
    else
    {
      this.toastrService.error(`Currently connected blockchain address does not own anything in this certificate, ${this.selectedBlockchainAccount}`);
      let owners ='';
      for( let key in this.selectedCertificateForClaim.owners)
      {
        owners = key +' : '+ this.selectedCertificateForClaim.owners[key] +'; ';
      }
      this.toastrService.info(`Current Owners ${owners}`);
    }

  }

  claimUsingEtherJS()
  {
    //@ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    //@ts-ignore
    //const daiContract = new ethers.Contract("0x4dae00fa86aC7548f92a0293A676Ad07b65c264F", registryABI, provider);
    
    const daiContract = new ethers.Contract(this.blockchainProperties.registry, registryABI, provider);
    const signer = provider.getSigner();
    const daiWithSigner = daiContract.connect(signer);
    
    let claimData={
      beneficiary: "claim from angular smart contract",
      location: "angular chrome",
      countryCode: "IND",
      periodStartDate: new Date(this.selectedCertificateForClaim.generationStartTime*1000).toISOString(),
      periodEndDate: new Date(this.selectedCertificateForClaim.generationEndTime*1000).toISOString(),
      purpose: "claim testing from new UI"
    }
    daiWithSigner.functions['safeTransferAndClaimFrom'](this.selectedBlockchainAccount,this.selectedBlockchainAccount,this.selectedCertificateForClaim.id,this.formattedClaimAmount,this.encodeClaimData(claimData),this.encodeClaimData(claimData));
  }
  

  encodeClaimData = (claimData:any) => {
    const { beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose } = claimData;
    console.log(beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose);
    console.log("ethers.utils.defaultAbiCoder.encode(['string', 'string', 'string', 'string', 'string', 'string'], [beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose]);",ethers.utils.defaultAbiCoder.encode(['string', 'string', 'string', 'string', 'string', 'string'], [beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose]));
    return ethers.utils.defaultAbiCoder.encode(['string', 'string', 'string', 'string', 'string', 'string'], [beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose]);
}

 
}

