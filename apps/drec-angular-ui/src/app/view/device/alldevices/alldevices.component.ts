

import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MediaMatcher } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
// import { NavItem } from './nav-item';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { AuthbaseService } from '../../../auth/authbase.service';
import { DeviceService } from '../../../auth/services/device.service';
import { Router } from '@angular/router';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];
@Component({
  selector: 'app-alldevices',
  templateUrl: './alldevices.component.html',
  styleUrls: ['./alldevices.component.scss']
})

export class AlldevicesComponent {
  displayedColumns = [
    'onboarding_date',
    'projectName',
    'externalId',
    'countryCode',
    'fuelCode',
    'commissioningDate',
    'capacity',
    'SDGBenefits',
    'actions',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;
  data: any;
  loginuser: any
  deviceurl: any;
  pageSize: number = 20;
  countrylist: any;
  fuellist: any;
  devicetypelist: any;
  fuellistLoaded: boolean = false;
  devicetypeLoded: boolean = false;
  countrycodeLoded: boolean = false;
  loading: boolean = true;
  public sdgblist: any;
  FilterForm: FormGroup;
  p: number = 1;
  totalRows = 0;
  filteredOptions: Observable<any[]>;
  offtaker = ['School', 'Health Facility', 'Residential', 'Commercial', 'Industrial', 'Public Sector', 'Agriculture']
  endminDate = new Date();
  totalPages: number;
  constructor(private authService: AuthbaseService, private deviceService: DeviceService, private formBuilder: FormBuilder, private router: Router) {
    this.loginuser = JSON.parse(sessionStorage.getItem('loginuser')!);
    this.FilterForm = this.formBuilder.group({
      countryCode: [],
      fuelCode: [],
      deviceTypeCode: [],
      capacity: [],
      offTaker: [],
      SDGBenefits: [],
      start_date: [null],
      end_date: [null],
      pagenumber: [this.p]
    });
  }
  ngOnInit(): void {
    this.authService.GetMethod('device/fuel-type').subscribe(
      (data1) => {
        // display list in the console
        this.fuellist = data1;
        this.fuellistLoaded = true;
      });
    this.authService.GetMethod('device/device-type').subscribe(
      (data2) => {
        // display list in the console
        this.devicetypelist = data2;
        this.devicetypeLoded = true;
      }
    );
    this.authService.GetMethod('countrycode/list').subscribe(
      (data3) => {
        // display list in the console
        // console.log(data)
        this.countrylist = data3;
        this.countrycodeLoded = true;
      }
    )
    this.authService.GetMethod('sdgbenefit/code').subscribe(
      (data) => {
        // display list in the console 

        this.sdgblist = data;

      }
    )
    this.getDeviceListData(this.p);
    console.log("myreservation");

    // setTimeout(() => this.DisplayList(), 10000);
    setTimeout(() => {
      this.loading = false;
      this.applycountryFilter();
      this.DisplayList();
    }, 1000)
  }
  isAnyFieldFilled: boolean = false;

  checkFormValidity(): void {
    console.log("115");
    const formValues = this.FilterForm.value;
    this.isAnyFieldFilled = Object.values(formValues).some(value => !!value);
    console.log(this.isAnyFieldFilled);
  }
  applycountryFilter() {
    this.FilterForm.controls['countryCode'];
    this.filteredOptions = this.FilterForm.controls['countryCode'].valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
    console.log(this.filteredOptions);
  }

  private _filter(value: any): string[] {
    console.log(value)
  
    const filterValue = value.toLowerCase();
    return this.countrylist.filter((option: any) => option.country.toLowerCase().indexOf(filterValue.toLowerCase()) === 0);

  }

  reset() {
    this.FilterForm.reset();
    this.loading = false;
    this.isAnyFieldFilled = false;
    this.p = 1;
    this.getDeviceListData(this.p);
  }

  onEndChangeEvent(event: any) {
    console.log(event);
    this.endminDate = event;
  }

  DisplayListFilter() {
    this.p = 1;
    this.getDeviceListData(this.p);
  }

  getDeviceListData(page: number) {
    if (this.loginuser.role === 'Admin') {
      this.deviceurl = 'device?';
    } else {
      this.deviceurl = 'device/my?';
    }
    this.FilterForm.controls['pagenumber'].setValue(page);
    this.deviceService.GetMyDevices(this.deviceurl, this.FilterForm.value).subscribe(
      (data) => {
        console.log(data)
        //@ts-ignore
        if (data.devices) {
          this.loading = false;
          //@ts-ignore
          this.data = data;
          this.DisplayList()
        }
      }
    )
  }

  DisplayList() {
    if (this.fuellistLoaded == true && this.devicetypeLoded == true && this.countrycodeLoded === true) {
      //@ts-ignore
      this.data.devices.forEach(ele => {
        //@ts-ignore
        ele['fuelname'] = this.fuellist.find((fuelType) => fuelType.code === ele.fuelCode,)?.name;
        //@ts-ignore
        ele['devicetypename'] = this.devicetypelist.find(devicetype => devicetype.code == ele.deviceTypeCode)?.name;
        //@ts-ignore
        ele['countryname'] = this.countrylist.find(countrycode => countrycode.alpha3 == ele.countryCode)?.country;
      })

      this.dataSource = new MatTableDataSource(this.data.devices);
      this.totalRows = this.data.totalCount
      console.log(this.totalRows);
      this.totalPages = this.data.totalPages

      // this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

    }

  }
  UpdateDevice(externalId: any) {
    this.router.navigate(['/device/edit/' + externalId], { queryParams: { fromdevices: true } });
  }
  // pageChangeEvent(event: PageEvent) {
  //   console.log(event);
  //   this.p = event.pageIndex + 1;

  //   this.getDeviceListData();
  // }

  previousPage(): void {
    if (this.p > 1) {
      this.p--;
      this.getDeviceListData(this.p);
    }
  }

  nextPage(): void {
    if (this.p < this.totalPages) {
      this.p++;
      this.getDeviceListData(this.p);;
    }
  }
}
