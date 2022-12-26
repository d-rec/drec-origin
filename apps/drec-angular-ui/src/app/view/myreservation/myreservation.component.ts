
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
    'serialno',
    'name',
    'aggregatedCapacity',
    // 'buyerAddress',
    'capacityRange',
    'frequency',
    'reservationEndDate',
    'reservationStartDate',
    'targetVolumeInMegaWattHour',
    'fuelCode',
    
    'actions',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;
  data:any;
  constructor(private authService: AuthbaseService, private router: Router,) { }
  ngOnInit() {
    console.log("myreservation");
    this.DisplayList()
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  DisplayList() {
    this.authService.GetAllProducts('device-group/my').subscribe(
      (data) => {
        // display list in the console 
        console.log(data)
        this.data = data;
        this.dataSource = new MatTableDataSource(this.data);
        this.dataSource.paginator = this.paginator
      }
    )
  }

}
