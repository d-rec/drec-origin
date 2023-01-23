

import { SelectionModel } from '@angular/cdk/collections';
import { MediaMatcher } from '@angular/cdk/layout';
import { Component, ViewChild, TemplateRef,ViewChildren, QueryList, ChangeDetectorRef, OnInit } from '@angular/core';
// import { NavItem } from './nav-item';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { AuthbaseService } from '../../auth/authbase.service';
import { Router,ActivatedRoute, Params } from '@angular/router';
import {environment} from '../../../environments/environment';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as moment from 'moment';
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
  @ViewChild('templateBottomSheet') TemplateBottomSheet: TemplateRef<any>;
  displayedColumns = ['serialno','certificateStartDate', 'certificateEndDate','owners'];
   innerDisplayedColumns = ['certificate_issuance_startdate','certificate_issuance_enddate','deviceid', 'readvalue_watthour'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;
  data:any;
  group_uid: string;
  energyurl:any;
  group_name:any;
  panelOpenState = false;
  claimData: FormGroup;
  countrylist:any;
  maxDate = new Date();
  filteredOptions: Observable<any>;
  constructor(private authService: AuthbaseService, private router: Router,
     private activatedRoute: ActivatedRoute, private bottomSheet: MatBottomSheet,
     private fb: FormBuilder,) {

    this.activatedRoute.queryParams.subscribe(params => {
      this.group_uid = params['id'];
      this.group_name = params['name'];
     
  });
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
    this.energyurl=environment.Explorer_URL+'/block/';
    console.log("myreservation");
    this.DisplayList();
    this.AllCountryList();
    this.claimData.controls['countryCode'];
    this.filteredOptions = this.claimData.controls['countryCode'].valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
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

  applyFilter(event: Event): void {
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
          ele['generationEndTimeinUTC'] = new Date(ele.generationEndTime *1000).toISOString()
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
  onSubmit(): void {}
  
 
}

