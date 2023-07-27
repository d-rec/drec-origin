
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MediaMatcher } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild, ViewChildren, QueryList, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { NavItem } from './nav-item';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator,PageEvent } from '@angular/material/paginator';
import { AuthbaseService } from '../../auth/authbase.service';
import { ReservationService } from '../../auth/services/reservation.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';

@Component({
  selector: 'app-myreservation',
  templateUrl: './myreservation.component.html',
  styleUrls: ['./myreservation.component.scss']
})



export class MyreservationComponent implements OnInit {
  displayedColumns = [
    'actions',
    'name',
    'aggregatedCapacity',
    'reservationActive',
    'frequency',
    'reservationStartDate',
    'reservationEndDate',
    'targetVolumeInMegaWattHour',
    //'fuelCode',
    'number Of Devices',
    'SDGBenefits',
   
  ];
  displayedColumns1 = [
    'projectName',
    'countryCode',
    'capacity',
    'createdAt',
    'offTaker',
    'deviceTypeCode',
    'fuelCode',
    'commissioningDate',
    'SDGBenefits',

    // 'actions',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator1: MatPaginator;
  @ViewChild(MatSort) sort1: MatSort;
  dataSource: MatTableDataSource<any>;
  dataSource1: MatTableDataSource<any>;
  data: any;
  pageSize: number = 10;
  showdevicesinfo: boolean = false;
  DevicesList: any;
  isLoadingResults: boolean = true;
  countrylist: any;
  fuellist: any;
  devicetypelist: any;
  FilterForm: FormGroup;
  public sdgblist: any;
  p: number = 1;
  totalRows = 0;
  offtaker = ['School', 'Health Facility', 'Residential', 'Commercial', 'Industrial', 'Public Sector', 'Agriculture']
  filteredOptions: Observable<any[]>;
  endminDate = new Date();
  group_info:any;
  reservationsstatus:any;
  reservationstart:any;
  constructor(private authService: AuthbaseService,
    private reservationService: ReservationService,
    private router: Router, private formBuilder: FormBuilder,
    private toastrService: ToastrService,

  ) { }
  ngOnInit() {

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.FilterForm = this.formBuilder.group({
      countryCode: [],
      fuelCode: [],
      offTaker: [],
      SDGBenefits: [],
      reservationStartDate: [null],
      reservationEndDate: [null],
      reservationActive: [],
      pagenumber: [this.p]
    });

    console.log("myreservation");
    this.DisplayList()
    this.DisplayfuelList();
    this.DisplaytypeList();
    this.DisplaycountryList();
    this.DisplaySDGBList()
    // this.getcountryListData();

    console.log("myreservation");
    setTimeout(() => {
      //  this.loading=false;

      this.applycountryFilter();
    }, 2000)
  }
  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  //   this.dataSource.sort = this.sort;
  // }
  applycountryFilter() {
    this.FilterForm.controls['countryCode'];
    console.log(this.FilterForm.controls['countryCode']);
    this.filteredOptions = this.FilterForm.controls['countryCode'].valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
    console.log(this.filteredOptions);
  }
  private _filter(value: any): string[] {
    console.log(value)
    const filterValue = value.toLowerCase();

    // if (this.countrycodeLoded === true) {
    console.log(this.countrylist.filter((option: any) => option.country.toLowerCase().indexOf(filterValue.toLowerCase()) === 0))
    return this.countrylist.filter((option: any) => option.country.toLowerCase().indexOf(filterValue.toLowerCase()) === 0);

  }
  onEndChangeEvent(event: any) {
    console.log(event);
    this.endminDate = event;


  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  DisplayfuelList() {

    this.authService.GetMethod('device/fuel-type').subscribe(
      (data) => {
        // display list in the console 

        this.fuellist = data;

      }
    )
  }
  DisplaytypeList() {

    this.authService.GetMethod('device/device-type').subscribe(
      (data) => {
        // display list in the console 

        this.devicetypelist = data;

      }
    )
  }
  DisplaycountryList() {

    this.authService.GetMethod('countrycode/list').subscribe(
      (data) => {
        // display list in the console 
        // console.log(data)
        this.countrylist = data;

      }
    )
  }

  DisplaySDGBList() {

    this.authService.GetMethod('sdgbenefit/code').subscribe(
      (data) => {
        // display list in the console 
        console.log(data)
        this.sdgblist = data;

      }
    )
  }
  isAnyFieldFilled: boolean = false;

  checkFormValidity(): void {
    console.log("115");
    const formValues = this.FilterForm.value;
    this.isAnyFieldFilled = Object.values(formValues).some(value => !!value);
    console.log(this.isAnyFieldFilled);
  }
  formfilter()
  {
    this.p=1;
    this.DisplayList()
  }
  DisplayList() {
    console.log(this.FilterForm.value)
    this.FilterForm.controls['pagenumber'].setValue(this.p);
    if (this.FilterForm.value.reservationActive === "All") {
      this.FilterForm.removeControl('reservationActive');
    }
    if (!(this.FilterForm.value.reservationStartDate != null && this.FilterForm.value.reservationEndDate === null)) {

      this.reservationService.getReservationData(this.FilterForm.value).subscribe(
        (data) => {
          this.showdevicesinfo = false;

          this.data = data.groupedData;
          //@ts-ignore
          this.data.forEach(ele => {

            if (ele.deviceIds != null) {
              ele['numberOfdevices'] = ele.deviceIds.length;
            } else {
              ele['numberOfdevices'] = 0;
            }


          })
          this.isLoadingResults = false;
          this.dataSource = new MatTableDataSource(this.data);
          console.log(this.dataSource);
          this.totalRows = data.totalCount;
          console.log(this.totalRows);
         
          this.dataSource.sort = this.sort;
        }
      )
    } else {
      this.toastrService.error("Filter error", "End date should be if in filter query you used with Start date");
    }
  }
  reset() {
    this.FilterForm.reset();
    // this.loading = false;
    // this.getDeviceListData();
    //this.selection.clear();
    this.p = 1;
    this.DisplayList()
  }

  DisplayCertificatepage(reservation_row: any) {
    console.log(typeof reservation_row.deviceIds);
    let changedeviceId = JSON.stringify(reservation_row.deviceIds)
    console.log(typeof changedeviceId);
    this.router.navigate(['/certificate'], { queryParams: { id: reservation_row.id } });

  }
  DisplayDeviceList(row: any) {
    this.FilterForm.reset();
    this.showdevicesinfo = true;

   this.group_info=row;
  //  this.reservationsstatus=row.reservationActivethis, 

  // this.reservationstart= "start from "+row.reservationStartDate+ " To "+row. reservationEndDate 
    this.DevicesList = [];
    //@ts-ignore
    row.deviceIds.forEach(ele => {
      this.authService.GetMethod('device/' + ele).subscribe(
        (data) => {

          this.data = data;
          // this.data.forEach(ele => {
          //@ts-ignore
          this.data['fuelname'] = this.fuellist.find((fuelType) => fuelType.code === this.data.fuelCode)?.name;
          //@ts-ignore
          this.data['devicetypename'] = this.devicetypelist.find(devicetype => devicetype.code == this.data.deviceTypeCode)?.name;
          //@ts-ignore
          this.data['countryname'] = this.countrylist.find(countrycode => countrycode.alpha3 == this.data.countryCode)?.country;
          // })
          this.DevicesList.push(data)
          this.dataSource1 = new MatTableDataSource(this.DevicesList);
        })

    });


    console.log(this.dataSource1);
    //this.dataSource1.paginator = this.paginator1;
    //this.dataSource1.sort = this.sort1;
    // this.DevicesList.forEach(ele => {

    //   if (ele.deviceIds != null) {
    //     ele['numberOfdevices'] = ele.deviceIds.length;
    //   } else {
    //     ele['numberOfdevices'] = 0;
    //   }


    // })

  }
  pageChangeEvent(event: PageEvent) {
    console.log(event);
    this.p = event.pageIndex + 1;

    this.DisplayList();
  }
}
