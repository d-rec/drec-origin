

import { FormBuilder } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MediaMatcher } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
// import { NavItem } from './nav-item';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { AuthbaseService } from '../../../auth/authbase.service';
import { Router } from '@angular/router';
import { concat } from 'rxjs';
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
// export class AlldevicesComponent {
//   displayedColumns = [
//     'onboarding_date',
//     'projectName',
//     'externalId',
//     'countryCode',
//     'fuelCode',
//     'status',
//     'actions',
//   ];
//   @ViewChild(MatPaginator) paginator: MatPaginator;
//   @ViewChild(MatSort) sort: MatSort;
//   dataSource: MatTableDataSource<any>;
//   data: any;
//   loginuser: any
//   deviceurl: any;
//   pageSize: number = 20;
//   countrylist: any;
//   fuellist: any;
//   devicetypelist: any;
//   constructor(private authService: AuthbaseService, private router: Router) {
    
//     this.loginuser = sessionStorage.getItem('loginuser');
//   }
//   ngOnInit(): void {
    
//     this.authService.GetMethod('device/fuel-type').subscribe(
//       (data1) => {
//         // display list in the console 

//         this.fuellist = data1;

//       });
//       this.authService.GetMethod('device/device-type').subscribe(
//         (data2) => {
//           // display list in the console 
  
//           this.devicetypelist = data2;
  
//         }
//       );
//       this.authService.GetMethod('countrycode/list').subscribe(
//         (data3) => {
//           // display list in the console 
//           // console.log(data)
//           this.countrylist = data3;
  
//         }
//       )
//     console.log("myreservation");
//     // this.DisplayfuelList();
//     // this.DisplaytypeList();
//     // this.DisplaycountryList();
     
//      setTimeout(() => this.DisplayList(), 10000);

//   }
//   // ngAfterViewInit() {
//   //   this.dataSource.paginator = this.paginator;
//   //   this.dataSource.sort = this.sort;
    
//   // }

//   applyFilter(event: Event) {
//     const filterValue = (event.target as HTMLInputElement).value;
//     this.dataSource.filter = filterValue.trim().toLowerCase();

//     if (this.dataSource.paginator) {
//       this.dataSource.paginator.firstPage();
//     }
//   }
//   // DisplayfuelList() {

//   //   this.authService.GetMethod('device/fuel-type').subscribe(
//   //     (data1) => {
//   //       // display list in the console 

//   //       this.fuellist = data1;

//   //     }
//   //   )
//   // }
//   // DisplaytypeList() {

//   //   this.authService.GetMethod('device/device-type').subscribe(
//   //     (data2) => {
//   //       // display list in the console 

//   //       this.devicetypelist = data2;

//   //     }
//   //   )
//   // }
//   // DisplaycountryList() {

//   //   this.authService.GetMethod('countrycode/list').subscribe(
//   //     (data3) => {
//   //       // display list in the console 
//   //       // console.log(data)
//   //       this.countrylist = data3;

//   //     }
//   //   )
//   // }
//   DisplayList() {
//     if (this.loginuser.role === 'Admin') {
//       this.deviceurl = 'device';
//     } else {
//       this.deviceurl = 'device/my';
//     }
//     this.authService.GetMethod(this.deviceurl).subscribe(
//       (data) => {
       
//         this.data = data;
//         //@ts-ignore
//        this.data.forEach(ele => {
//           //@ts-ignore
//           ele['fuelname'] = this.fuellist.find((fuelType) => fuelType.code === ele.fuelCode,)?.name;
//           //@ts-ignore
//           ele['devicetypename'] = this.devicetypelist.find(devicetype => devicetype.code == ele.deviceTypeCode)?.name;
//           //@ts-ignore
//           ele['countryname'] = this.countrylist.find(countrycode => countrycode.alpha3 == ele.countryCode)?.country;
//         })
//         console.log(this.data)
//         this.dataSource = new MatTableDataSource(this.data);
//         this.dataSource.paginator = this.paginator;
//         this.dataSource.sort = this.sort;
//       }
//     )
//   }
// }
export class AlldevicesComponent {
  displayedColumns = [
    'onboarding_date',
    'projectName',
    'externalId',
    'countryCode',
    'fuelCode',
    'status',
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
  fuellistLoaded:boolean=false;
  devicetypeLoded:boolean=false;
  countrycodeLoded:boolean=false;
  loading:boolean=true;
  constructor(private authService: AuthbaseService, private router: Router) {
    this.loginuser = sessionStorage.getItem('loginuser');
  }
  ngOnInit(): void {
    this.authService.GetMethod('device/fuel-type').subscribe(
      (data1) => {
        // display list in the console
        this.fuellist = data1;
        this.fuellistLoaded=true;
      });
      this.authService.GetMethod('device/device-type').subscribe(
        (data2) => {
          // display list in the console
          this.devicetypelist = data2;
          this.devicetypeLoded=true;
        }
      );
      this.authService.GetMethod('countrycode/list').subscribe(
        (data3) => {
          // display list in the console
          // console.log(data)
          this.countrylist = data3;
          this.countrycodeLoded=true;
        }
      )
     this.getDeviceListData();
    console.log("myreservation");
   
     this.DisplayList()
  }
  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  //   this.dataSource.sort = this.sort;
  // }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  getDeviceListData() {
    if (this.loginuser.role === 'Admin') {
      this.deviceurl = 'device';
    } else {
      this.deviceurl = 'device/my';
    }
    this.authService.GetMethod(this.deviceurl).subscribe(
      (data) => {
        this.data = data;
        //@ts-ignore
      }
    )
  }
  DisplayList()
  {
    
    if(this.fuellistLoaded== true && this.devicetypeLoded== true && this.countrycodeLoded===true)
    {
       //@ts-ignore
      this.data.forEach(ele => {
        //@ts-ignore
        ele['fuelname'] = this.fuellist.find((fuelType) => fuelType.code === ele.fuelCode,)?.name;
        //@ts-ignore
        ele['devicetypename'] = this.devicetypelist.find(devicetype => devicetype.code == ele.deviceTypeCode)?.name;
        //@ts-ignore
        ele['countryname'] = this.countrylist.find(countrycode => countrycode.alpha3 == ele.countryCode)?.country;
      })
      console.log(this.data)
      this.dataSource = new MatTableDataSource(this.data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      
    }
    else
    {
      setTimeout(()=>{
        this.loading=false;
      
          this.DisplayList();
      },10000)
    }
  }
}
