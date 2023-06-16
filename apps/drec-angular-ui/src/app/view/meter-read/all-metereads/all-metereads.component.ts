import { Component, ViewChild, OnInit,Inject} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MeterReadService, DeviceService } from '../../../auth/services';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import {MeterReadTableComponent} from '../meter-read-table/meter-read-table.component'
@Component({
  selector: 'app-all-metereads',
  templateUrl: './all-metereads.component.html',
  styleUrls: ['./all-metereads.component.scss']
})
export class AllMetereadsComponent implements OnInit {
  @ViewChild(MeterReadTableComponent)
  public counterComponent: MeterReadTableComponent;

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
 
  displayedColumns: string[] = ['startdate', 'enddate', 'value'];//... set columns here
 
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;
  readdata: any;
 
  devicedata: any;
  p: number = 1;
  total: number = 0;
  externalId: any;
  FilterForm: FormGroup;
  endminDate = new Date();
  showfilterform: boolean = true;
  totalRows = 0;
  pageSize = 5;
  currentPage = 0;
  pageSizeOptions: number[] = [5];
  filter: boolean = false;
  loginuser: any
  constructor(private service: MeterReadService, private formBuilder: FormBuilder,
    private deviceservice: DeviceService,
  
  ) {

    this.loginuser = JSON.parse(sessionStorage.getItem('loginuser')!);

    console.log(this.loginuser.role)
  }
  
  ngOnInit() {
    this.DisplayList();
  
      this.FilterForm = this.formBuilder.group({
        externalId: [Validators.required],
        start: [null, Validators.required],
        end: [null, Validators.required],
        pagenumber: [this.p]
     });
 

  }
  reset() {
    this.FilterForm.reset();
    this.filter=false;
    this.externalId=null;
    this.counterComponent.start(this.FilterForm,this.externalId,this.filter);
  }
  DisplayList() {
    if (this.loginuser.role === 'Buyer') {
      this.deviceservice.GetUnreserveDevices().subscribe(
        (data) => {
          // display list in the console 
          this.devicedata = data;
        }
      )
    } else if (this.loginuser.role === 'OrganizationAdmin') {
      const deviceurl = 'device/my';
      this.deviceservice.GetMyDevices(deviceurl).subscribe(
        (data) => {
          // display list in the console 
          this.devicedata = data;
        }
      )
    } else {
      this.deviceservice.GetDevicesForAdmin().subscribe(
        (data) => {
          // display list in the console 
          this.devicedata = data;
        }
      )
    }

  }
  onEndChangeEvent(event: any) {
    console.log(event);
   
    this.endminDate = event;
   

  }
  getPagedData() {
 this.filter=true;
    console.log(this.externalId);
    this.FilterForm.controls['pagenumber'].setValue(this.p);
    console.log(this.FilterForm)
    this.counterComponent.start(this.FilterForm,this.externalId,this.filter);
   
  }
  pageChangeEvent(event: PageEvent) {
    console.log(event);
    this.p = event.pageIndex + 1;
   
    this.getPagedData();
  }
}
