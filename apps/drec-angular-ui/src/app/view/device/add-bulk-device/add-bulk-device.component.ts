import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileuploadService } from '../../../auth/services/fileupload.service';
import { ToastrService } from 'ngx-toastr';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

import { DeviceService } from '../../../auth/services/device.service'
import { Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-add-bulk-device',
  templateUrl: './add-bulk-device.component.html',
  styleUrls: ['./add-bulk-device.component.scss']
})
export class AddBulkDeviceComponent implements OnInit {
  currentFile?: File | null;
  progress = 0;
  message = '';
  pageSize: number = 10;
  fileName = 'Please click here to select file';
  fileInfos?: Observable<any>;
  showdevicesinfo: boolean = false;
  DevicestatusList: any = [];
  loading: boolean = true;
  objectKeys = Object.keys;
  displayedColumns = [
    "serialno",
    "createdAt",
    "jobId",
    "fileId",
    "status",
    "actions"];
  displayedColumns1 = [
    "serialno",
    "externalId",
    "errorsList",
    "Status",
    "Action"
  ];
  constructor(private uploadService: FileuploadService,
    private deviceService: DeviceService, private router: Router,
    private toastrService: ToastrService) { }
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;
  dataSource1: MatTableDataSource<any>;
  data: any;
  ngOnInit(): void {
    this.JobDisplayList();

  }
  reset() {
    this.currentFile = null;
    this.fileName = 'Please click here to select file';
  }
  selectFile(event: any): void {
    console.log(event)
    if (event.target.files && event.target.files[0]) {
      const file: File = event.target.files[0];
      this.currentFile = file;
      this.fileName = this.currentFile.name;
      if (!this.fileName.endsWith('.csv')) {
        //throw new Error("file not found");
        this.fileName = 'Invalid file';
        this.currentFile = null;
      }
    } else {
      this.fileName = 'Please click here to select file';
    }
    event.target.value='';
  }

  openFileExplorer()
  {
    console.log("came here")
    console.log(this.currentFile);
    document.getElementById("fileInput")?.click();
  }

  upload(): void {
    this.progress = 0;
    this.message = '';

    if (this.currentFile) {
      this.uploadService.csvupload(this.currentFile).subscribe(
        (event: any) => {
          console.log(event);
          let obj: any = {};
          obj['fileName'] = event[0];
          this.uploadService.addbulkDevices(obj).subscribe({
            next: (data: any) => {
              console.log(data)
              this.JobDisplayList();
              // this.selectFile()
              // this.readForm.reset();
              this.currentFile = null;
              this.fileName = 'Please click here to Select File';
              this.toastrService.success('Successfully!', 'Devices Uploaded in Bulk!!');
            },
            error: (err) => {                          //Error callback
              console.error('error caught in component', err)
              this.toastrService.error('error!', err.error.message);
            }
          });
          // if (event.type === HttpEventType.UploadProgress) {
          //   this.progress = Math.round((100 * event.loaded) / event.total);
          // } else if (event instanceof HttpResponse) {
          //   this.message = event.body.message;


          // }
        },
        (err: any) => {
          console.log(err);
          this.progress = 0;

          if (err.error && err.error.message) {
            this.message = err.error.message;
          } else {
            this.message = 'Could not upload the file!';
          }

          this.currentFile = null;
        }
      );
    }
  }
  JobDisplayList() {
    this.showdevicesinfo = false;
    this.loading = true;
    this.uploadService.getCsvJobList().subscribe(
      (data) => {
        // display list in the console 
        this.loading = false;
        this.data = data;
        this.dataSource = new MatTableDataSource(this.data);
        this.dataSource.paginator = this.paginator
        this.dataSource.sort = this.sort;
      }
    )
  }
  DisplayDeviceLogList(jobid: number) {

    this.showdevicesinfo = true;
    this.DevicestatusList = [];

    this.uploadService.getJobStatus(jobid).subscribe(
      (data) => {

        this.data = data.errorDetails.log.errorDetails;
        console.log(this.data);
        // this.data = data;
        this.dataSource1 = new MatTableDataSource(this.data);
        this.dataSource1.paginator = this.paginator

      })



  }

  UpdateDevice(externalId: any) {

    this.deviceService.getDeviceInfoBYexternalId(externalId).subscribe(
      (data) => {
        if (data) {
          this.router.navigate(['/device/edit/' + externalId], { queryParams: { frombulk: true } });
        } else {
          this.toastrService.error('device id has been updated', 'current external id not found!!');
        }
      },
      (error) => {                              //Error callback
        console.error('error caught in component', error)
        this.toastrService.error('device id has been updated', 'current external id not found!!');
      }
    );

  }
}
