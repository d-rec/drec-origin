

import { SelectionModel } from '@angular/cdk/collections';
import { MediaMatcher } from '@angular/cdk/layout';
import { Component, ViewChild, TemplateRef, ViewChildren, QueryList, ChangeDetectorRef, OnInit, Input, OnDestroy } from '@angular/core';
// import { NavItem } from './nav-item';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { animate, group, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { AuthbaseService } from '../../auth/authbase.service';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { environment } from '../../../environments/environment';
import { BlockchainDrecService } from '../../auth/services/blockchain-drec.service';
import { BlockchainProperties } from '../../models/blockchain-properties.model';
import { ethers } from 'ethers';
import { ToastrService } from 'ngx-toastr';
import { ReservationService } from '../../auth/services/reservation.service';
import { issuerABI } from './issuer-abi';
import { registryABI } from './registery-abi';
import { MeterReadService } from '../../auth/services/meter-read.service'
export interface Student {
  firstName: string;
  lastName: string;
  studentEmail: string;
  course: string;
  yearOfStudy: number;

}
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as moment from 'moment';
import { DateAdapter } from '@angular/material/core';
import { DeviceService } from '../../auth/services/device.service';
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
export class CertificateComponent implements OnDestroy {
  @Input() dataFromComponentA: any;
  @ViewChild('templateBottomSheet') TemplateBottomSheet: TemplateRef<any>;
  displayedColumns = ['serialno', 'certificateStartDate', 'certificateEndDate', 'owners'];
  innerDisplayedColumns = ['certificate_issuance_startdate', 'certificate_issuance_enddate', 'externalId', 'readvalue_watthour'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;
  data: any;
  group_id: string;
  group_uid: string;
  energyurl: any;
  group_name: any;
  panelOpenState = false;
  claimData: FormGroup;
  countrylist: any;
  maxDate = new Date();
  filteredOptions: Observable<any>;
  loading: boolean = true;
  history_nextissuanclist: any;
  ongoingnextissuance: any;
  devicesId: any
  alldevicescertifiedlogdatrange: any = [];
  intervalId: any;
  reservationstatus: boolean;
  constructor(private blockchainDRECService: BlockchainDrecService, private authService: AuthbaseService, private router: Router, private activatedRoute: ActivatedRoute, private toastrService: ToastrService, private bottomSheet: MatBottomSheet,
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private readService: MeterReadService,
    private deviceService: DeviceService
  ) {

    this.activatedRoute.queryParams.subscribe(params => {
      this.group_id = params['id'];


    });

    this.reservationService.GetMethodById(this.group_id).subscribe(
      (data: any) => {
        console.log(data);
        //@ts-ignore
        this.group_name = data.name;
        this.devicesId = data.deviceIds;
        this.reservationstatus = data.reservationActive;
        this.group_uid = data.devicegroup_uid

      }

    )
  }
  ngOnInit() {
    this.claimData = this.fb.group({
      beneficiary: [null, Validators.required],//"claim from angular smart contract", // ui text field
      location: [null, Validators.required],//"angular chrome", // ui text field
      countryCode: [null, Validators.required],//"IND", // country code drodpown
      periodStartDate: [new Date(), Validators.required], // date picker
      periodEndDate: [new Date(), Validators.required], // date picker
      purpose: [null, Validators.required],//"claim testing from new UI" // ui text field
    })
    this.energyurl = environment.Explorer_URL + '/block/';
    console.log("myreservation");
    setTimeout(() => {
      this.DisplayList();
    }, 3000);
    this.getBlockchainProperties();
    this.AllCountryList();
    this.claimData.controls['countryCode'];
    this.filteredOptions = this.claimData.controls['countryCode'].valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
    this.selectAccountAddressFromMetamask();

    console.log("drt46")
    this.intervalId = setInterval(() => {
      if (this.reservationstatus) {
        this.getnextissuancinfo();
        this.getlastreadofdevices();
        this.getcertifiedlogdaterange();
      }
    }, 20000);




  }
  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
  getnextissuancinfo() {
    this.reservationService.GetnextissuanceCycleinfo(this.group_uid).subscribe(
      (data: any) => {
        console.log(data);
        //@ts-ignore
        this.history_nextissuanclist = data.AllDeviceshistnextissuansinfo;
        this.ongoingnextissuance = data.ongoing_next_issuance
      }

    )
  }
  alldevicesread: any = []
  getlastreadofdevices() {
    console.log(this.devicesId)
    console.log(typeof this.devicesId)
    this.alldevicesread = [];
    if (typeof this.devicesId === 'string') {
      this.readService.Getlastread(this.devicesId).subscribe({
        next: data => {
          console.log(data),
            this.alldevicesread.push(data)
          console.log(this.alldevicesread)
        },
        error: err => {                      //Error callback
          console.error('error caught in component', err)
          //.toastrService.error('device id has been updated', 'current external id not found!!');

        }
      })
    } else {

      this.devicesId.forEach((elemant: any) => {
        this.readService.Getlastread(elemant).subscribe({
          next: data => {
            console.log(data),
              this.alldevicesread.push(data)
            console.log(this.alldevicesread)
          },
          error: err => {                              //Error callback
            console.error('error caught in component', err)
            //.toastrService.error('device id has been updated', 'current external id not found!!');

          }
        })
      })
    }


  }

  getcertifiedlogdaterange() {
    console.log(typeof this.devicesId)
    if (typeof this.devicesId === 'string') {
      this.deviceService.getcertifieddevicelogdate(this.devicesId, this.group_uid).subscribe({
        next: data => {
          console.log(data);
          this.alldevicescertifiedlogdatrange = [];
          if (data.firstcertifiedstartdate != null && data.lastcertifiedenddate != null) {
            this.alldevicescertifiedlogdatrange.push(data)
          }
          console.log(this.alldevicescertifiedlogdatrange)
        },
        error: err => {                                //Error callback
          console.error('error caught in component', err)
          //.toastrService.error('device id has been updated', 'current external id not found!!');

        }
      });
    } else {
      this.alldevicescertifiedlogdatrange = [];
      this.devicesId.forEach((elemant: any) => {
        this.deviceService.getcertifieddevicelogdate(elemant, this.group_uid).subscribe({
          next: data => {
            console.log(data);

            if (data.firstcertifiedstartdate != null && data.lastcertifiedenddate != null) {
              this.alldevicescertifiedlogdatrange.push(data)
            }

            console.log(this.alldevicescertifiedlogdatrange)
          },
          error: err => {                               //Error callback
            console.error('error caught in component', err)
            //.toastrService.error('device id has been updated', 'current external id not found!!');

          }
        });

      })
    }

  }
  openTemplateSheetMenu() {
    this.bottomSheet.open(this.TemplateBottomSheet);
  }

  closeTemplateSheetMenu() {
    this.bottomSheet.dismiss();
  }
  AllCountryList() {

    this.authService.GetMethod('countrycode/list').subscribe(
      (data) => {
        // display list in the console 
        console.log(data)
        this.countrylist = data;

      }
    )
  }
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    //((u) => isRole(u.role, Role.DeviceOwner));
    return this.countrylist.filter((option: { country: string; }) => option.country.toLowerCase().includes(filterValue));
  }
  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  //   this.dataSource.sort = this.sort;
  // }

  blockchainProperties: BlockchainProperties;
  getBlockchainProperties() {
    this.blockchainDRECService.getBlockchainProperties().subscribe((response: BlockchainProperties) => {
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
  // CertificateClaimed:boolean=false;
  DisplayList() {
    console.log("certifed list")
    console.log(this.group_uid);
    this.authService.GetMethod('certificate-log/issuer/certified/new/' + this.group_uid).subscribe(
      (data: any) => {
        this.loading = false;
        // display list in the console 

        // this.data = data;
        //@ts-ignore
        this.data = data.filter(ele => ele !== null)
        //@ts-ignore
        this.data.forEach(ele => {

          ele['generationStartTimeinUTC'] = new Date(ele.generationStartTime * 1000).toISOString();
          ele['generationEndTimeinUTC'] = new Date(ele.generationEndTime * 1000).toISOString();
          //converting blockchain address to lower case
          if (ele.claims != null && (ele.claims.length > 0)) {
            ele['CertificateClaimed'] = true;
          }
          for (let key in ele.owners) {
            if (key !== key.toLowerCase()) {
              ele.owners[key.toLowerCase()] = ele.owners[key];
              delete ele.owners[key];
              // if(ele.owner[key].value=0){

              // }
            }
          }

          if (ele.creationBlockHash != "") {
            ele.creationBlockHash
            ele['energyurl'] = environment.Explorer_URL + '/token/' + this.blockchainProperties.registry + '/instance/' + ele.id + '/token-transfers'
          }
          //@ts-ignore
          else if (ele.transactions.find(ele1 => ele1.eventType == "IssuancePersisted")) {

            //@ts-ignore
            ele.creationBlockHash = ele.transactions.find(ele1 => ele1.eventType == "IssuancePersisted").transactionHash

            ele['energyurl'] = environment.Explorer_URL + '/token/' + this.blockchainProperties.registry + '/instance/' + ele.blockchainCertificateId + '/token-transfers'
          }
        })

      }

    )
  }

  getWindowEthereumObject() {
    //@ts-ignore
    return window.ethereum;
  }

  selectedCertificateForClaim: {
    id: number,
    deviceId: string, // groupId or reservation id
    generationStartTime: number,
    generationEndTime: number,
    owners: { [key: string]: string }
  }

  formattedClaimAmount: {
    hex: string,
    type: string
  }

  selectedBlockchainAccount: string = '';

  checkMetamaskConnected() {
    return typeof window !== 'undefined' && typeof this.getWindowEthereumObject() !== 'undefined';
  }

  connectWallet() {
    //@ts-ignore   
    if (typeof window !== 'undefined' && typeof window.ethereum! == 'undefined') {
      try {
        //@ts-ignore
        window.ethereum.request({ method: 'eth_requestAccounts' })

      }
      catch (e) {
        console.error("some error occures", e);
      }
    }
  }

  selectAccountAddressFromMetamask() {
    //@ts-ignore
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      //@ts-ignore
      window.ethereum.request({ method: 'eth_requestAccounts' }).then(response => {
        this.selectedBlockchainAccount = (response && response[0]) ? response[0] : '';
        this.selectedBlockchainAccount = this.selectedBlockchainAccount.toLowerCase();
        if (this.selectedBlockchainAccount === '') {
          this.toastrService.error('No Blockchain account selected please connect metamask account')
        }
      }).catch((error: any) => {
        console.log('Metamask is not connected, please first connect metamask then click this button to select account');
        console.log(error);
        this.toastrService.error('Metamask is not connected, please first connect metamask then click this button to select account');
      });
    }
    else {
      this.toastrService.error('Metamask is not connected, please first connect metamask then click this button to select account');
    }
  }

  selectCertificateForClaim(certificate: any) {
    if (this.selectedBlockchainAccount === '') {
      this.openTemplateSheetMenu();
      this.toastrService.error('No account is connected currently, please connect metamask account');
      return;
    }
    this.selectedCertificateForClaim = certificate;
    this.getAmountForClaim(this.selectedBlockchainAccount);
  }
  getAmountForClaim(blockchainAccountAddress: string) {
    // this.selectedCertificateForClaim.owners[blockchainAccountAddress]="10998";
    if (this.selectedCertificateForClaim.owners[blockchainAccountAddress] && parseFloat(this.selectedCertificateForClaim.owners[blockchainAccountAddress]) > 0) {
      let convertingWattsToKiloWatts = Math.floor(parseFloat(this.selectedCertificateForClaim.owners[blockchainAccountAddress]) / 1000);
      this.blockchainDRECService.convertClaimAmountToHex(convertingWattsToKiloWatts).subscribe(response => {
        this.formattedClaimAmount = response;
        // this.claimUsingEtherJS();
        this.openTemplateSheetMenu();
      },
        error => {
          this.toastrService.error(`Some error occured while requesting for claim+ ${JSON.stringify(error)}`);
        })
    }
    else {
      this.toastrService.error(`Currently connected blockchain address does not own anything in this certificate, ${this.selectedBlockchainAccount}`);
      let owners = '';
      for (let key in this.selectedCertificateForClaim.owners) {
        owners = key + ' : ' + this.selectedCertificateForClaim.owners[key] + '; ';
      }
      this.toastrService.info(`Current Owners ${owners}`);
    }

  }

  claimUsingEtherJS() {
    //@ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    //@ts-ignore
    //const daiContract = new ethers.Contract("0x4dae00fa86aC7548f92a0293A676Ad07b65c264F", registryABI, provider);

    const daiContract = new ethers.Contract(this.blockchainProperties.registry, registryABI, provider);
    const signer = provider.getSigner();
    const daiWithSigner = daiContract.connect(signer);

    let claimData = {
      beneficiary: 'Beneficiary: ' + this.claimData.value.beneficiary,
      location: 'Location: ' + this.claimData.value.location,
      countryCode: 'Country Code: ' + this.claimData.value.countryCode,
      periodStartDate: 'Period Start Date: ' + new Date(this.selectedCertificateForClaim.generationStartTime * 1000).toISOString(),
      periodEndDate: 'Period End Date: ' + new Date(this.selectedCertificateForClaim.generationEndTime * 1000).toISOString(),
      purpose: 'Purpose: ' + this.claimData.value.purpose
    }
    console.log(claimData);
    daiWithSigner.functions['safeTransferAndClaimFrom'](this.selectedBlockchainAccount, this.selectedBlockchainAccount, this.selectedCertificateForClaim.id, this.formattedClaimAmount, this.encodeClaimData(claimData), this.encodeClaimData(claimData));

    setTimeout(() => {
      this.toastrService.info(`Please check metamask for success or failure of claim of this certificate`);
      this.closeTemplateSheetMenu();
    }, 1000);


  }


  encodeClaimData = (claimData: any) => {
    const { beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose } = claimData;
    console.log(beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose);
    console.log("ethers.utils.defaultAbiCoder.encode(['string', 'string', 'string', 'string', 'string', 'string'], [beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose]);", ethers.utils.defaultAbiCoder.encode(['string', 'string', 'string', 'string', 'string', 'string'], [beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose]));
    return ethers.utils.defaultAbiCoder.encode(['string', 'string', 'string', 'string', 'string', 'string'], [beneficiary, location, countryCode, periodStartDate, periodEndDate, purpose]);
  }


  goback() {
    this.router.navigate(['/myreservation']);
  }

}

