
import { FormBuilder } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MediaMatcher } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
// import { NavItem } from './nav-item';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { AuthbaseService } from '../../auth/authbase.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-myreservation',
  templateUrl: './myreservation.component.html',
  styleUrls: ['./myreservation.component.scss']
})



export class MyreservationComponent implements OnInit {
  displayedColumns = [

    'name',
    'aggregatedCapacity',
    // 'buyerAddress',
    // 'capacityRange',
    'frequency',
    'reservationStartDate',
    'reservationEndDate',
    'targetVolumeInMegaWattHour',
    //'fuelCode',
    'number Of Devices',
    'actions',
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
    // 'actions',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator1: MatPaginator;
  @ViewChild(MatSort) sort1: MatSort;
  dataSource: MatTableDataSource<any>;
  dataSource1: MatTableDataSource<any>;
  data: any;
  pageSize: number = 20;
  showdevicesinfo: boolean = false;
  DevicesList: any;
  isLoadingResults = false;
  constructor(private authService: AuthbaseService, private router: Router,) { }
  ngOnInit() {
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
  DisplayList() {
    this.authService.GetMethod('device-group/my').subscribe(
      (data) => {
        this.showdevicesinfo = false;

        this.data = data;
        //@ts-ignore
        this.data.forEach(ele => {

          if (ele.deviceIds != null) {
            ele['numberOfdevices'] = ele.deviceIds.length;
          } else {
            ele['numberOfdevices'] = 0;
          }


        })
        this.dataSource = new MatTableDataSource(this.data);
        console.log(this.dataSource);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    )
  }

  DisplayDeviceList(deviceid: number[]) {

    this.showdevicesinfo = true;
    this.DevicesList = [];
    deviceid.forEach(ele => {
      this.authService.GetMethod('device/' + ele).subscribe(
        (data) => {

          this.data = data;

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

}
