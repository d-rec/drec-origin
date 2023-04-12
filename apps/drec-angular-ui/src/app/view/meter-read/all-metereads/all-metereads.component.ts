import { Component,ViewChild,OnInit  } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator,PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MeterReadService, DeviceService } from '../../../auth/services';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';

@Component({
  selector: 'app-all-metereads',
  templateUrl: './all-metereads.component.html',
  styleUrls: ['./all-metereads.component.scss']
})
export class AllMetereadsComponent implements OnInit  {
 
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  //dataSource = new MatTableDataSource<ApidatumDisplay>([]);
  displayedColumns: string[]=['timestamp','value'] ;//... set columns here
  // displayedColumns = [
  //   'onboarding_date',
  //   'projectName',
  //   'externalId',
  //   'countryCode',
  //   'fuelCode',
  //   'status',
  //   'actions',
  // ];
 // @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;
  data:any;
  devicedata:any;
  p: number = 1;
  total: number = 0;
  exterenalId:any; 
  FilterForm: FormGroup;
  endminDate = new Date();

  totalRows = 0;
  pageSize = 5;
  currentPage = 0;
  pageSizeOptions: number[] = [5, 10, 25, 100];
  loading:boolean=true;
  constructor(private service:MeterReadService,private formBuilder: FormBuilder,private deviceservice: DeviceService,) {}
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  ngOnInit() {
    this.DisplayList();
    //this.getPagedData();
    this.FilterForm = this.formBuilder.group({
      exterenalId:[Validators.required],
      start: [null, Validators.required],
      end: [null, Validators.required],
      pagenumber:[this.p]
    });
  }
  reset() {
    this.FilterForm.reset();
   // this.loading = false;
    // this.getDeviceListData();
  //  this.selection.clear();
  }
  DisplayList() {
    this.deviceservice.GetMyDevices().subscribe(
      (data) => {
        // display list in the console 
        this.devicedata = data;
      }
    )
  }
  getPagedData() {
  console.log(this.exterenalId);
  console.log(this.FilterForm);
  console.log(this.p);
  this.FilterForm.controls['pagenumber'].setValue(this.p);
  
      this.service.GetRead(this.exterenalId,this.FilterForm.value)
        .subscribe((response: any) => {
          console.log(response)
          this.data = response;
          this.dataSource = new MatTableDataSource(this.data.ongoing);
          this.totalRows=this.data.numberOfReads
          //this.dataSource.paginator = this.paginator;
         // this.dataSource.sort = this.sort;
          this.currentPage = this.data.currentPageNumber;
          this.loading=false;
        });
  } 
      
    pageChangeEvent(event: PageEvent){
      console.log(event);
      this.p = event.pageIndex;
      //this.FilterForm.controls['pagenumber'].setValue(this.p);
      this.getPagedData();
  }
}
