import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild, TemplateRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AuthbaseService } from '../../auth/authbase.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import { ParseTreeResult } from '@angular/compiler';
import { ToastrService } from 'ngx-toastr';
import { DeviceService } from '../../auth/services/device.service'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatBottomSheet, MatBottomSheetConfig, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import {MeterReadTableComponent} from '../meter-read/meter-read-table/meter-read-table.component'
@Component({
  selector: 'app-add-reservation',
  templateUrl: './add-reservation.component.html',
  styleUrls: ['./add-reservation.component.scss']
})

export class AddReservationComponent {
  displayedColumns = [
    'select',
    'onboarding_date',
    'projectName',
    'externalId',
    'countryCode',
    'fuelCode',
    'status',
    'viewread'

  ];
  bottomSheetRef = {} as MatBottomSheetRef<MeterReadTableComponent>
  @ViewChild('mypopupDialog') popupDialog = {} as TemplateRef<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: MatTableDataSource<any>;
  data: any;
  loginuser: any
  deviceurl: any;
  pageSize: number = 10;
  countrylist: any;
  fuellist: any;
  devicetypelist: any;
  fuellistLoaded: boolean = false;
  devicetypeLoded: boolean = false;
  countrycodeLoded: boolean = false;
  loading: boolean = false;
  selection = new SelectionModel<any>(true, []);
  reservationForm: FormGroup;
  
  endminDate = new Date();
  FilterForm: FormGroup;
  offtaker = ['School', 'HealthFacility', 'Residential', 'Commercial', 'Industrial', 'PublicSector', 'Agriculture']
  frequency = ['hourly', 'daily', 'weekly', 'monthly']
  dialogRef: any;
  reservationbollean = { continewwithunavilableonedevice: true, continueWithTCLessDTC: true };
  constructor(private authService: AuthbaseService, private router: Router, 
    public dialog: MatDialog,private bottomSheet: MatBottomSheet,
    private formBuilder: FormBuilder, private toastrService: ToastrService, private deviceservice: DeviceService) {
    this.loginuser = sessionStorage.getItem('loginuser');
    this.reservationForm = this.formBuilder.group({
      name: [null, Validators.required],
      deviceIds: [Validators.required],
      targetCapacityInMegaWattHour: [null],
      reservationStartDate: [null, Validators.required],
      reservationEndDate: [null, Validators.required],
      continueWithReservationIfOneOrMoreDevicesUnavailableForReservation: [true],
      continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration: [true],
      authorityToExceed: [true],
      frequency: [null, Validators.required],
      blockchainAddress: [null]
    });
    this.FilterForm = this.formBuilder.group({
      countryCode: [],
      fuelCode: [],
      deviceTypeCode: [],
      capacity: [],
      offTaker: [],
    });
  }
  ngOnInit() {
    
    this.authService.GetMethod('device/fuel-type').subscribe(
      (data1: any) => {
      
        this.fuellist = data1;
        this.fuellistLoaded = true;
      });
    this.authService.GetMethod('device/device-type').subscribe(
      (data2: any) => {
      
        this.devicetypelist = data2;
        this.devicetypeLoded = true;
      }
    );
    this.authService.GetMethod('countrycode/list').subscribe(
      (data3: any) => {
       
        this.countrylist = data3;
        this.countrycodeLoded = true;
      }
    )
  
    console.log("myreservation");
  }

  openBottomSheet(device:any) {
    if(this.reservationForm.value.reservationStartDate!=null && this.reservationForm.value.reservationEndDate!=null){
      let requestreaddata:any ={devicename:device.externalId,rexternalid:device.id,reservationStartDate:this.reservationForm.value.reservationStartDate,reservationEndDate:this.reservationForm.value.reservationEndDate}
      const config: MatBottomSheetConfig = { data: requestreaddata };
      this.bottomSheetRef = this.bottomSheet.open(MeterReadTableComponent, config);
      this.bottomSheetRef.afterOpened().subscribe(() => {
        console.log('Bottom sheet is open.');
      });
      this.bottomSheetRef.afterDismissed().subscribe(data => {
        console.log('Return value: ', data);
      });
    }else{
      this.toastrService.error('Validation!', 'Please add start and end date');
    }
   
  }
  reset() {
    this.FilterForm.reset();
    this.loading = false;
    // this.getDeviceListData();
    this.selection.clear();
  }

  isAllSelected() {
    console.log("125")
    console.log(this.selection.selected);
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  masterToggle() {
    console.log("131")
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }
  onEndChangeEvent(event: any) {
    console.log(event);
     this.endminDate = event;
  

  }


  getDeviceListData() {

    this.deviceservice.GetUnreserveDevices().subscribe(
      (data) => {
        this.data = data;
        this.displayList();
        //@ts-ignore
      }
    )
  }
  displayList() {
    if (this.fuellistLoaded == true && this.devicetypeLoded == true && this.countrycodeLoded === true) {
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
      this.loading = false;
    }
  }
  applyFilter() {
    // this.data=this.selection.selected;
    console.log(this.FilterForm.value);

    this.deviceservice.getfilterData(this.FilterForm.value).subscribe(
      (data) => {
      
        this.loading = true;
        if (this.selection.selected.length > 0) {
          this.selection.selected.forEach((ele) => {
            //@ts-ignore
            if (data.find(
              //@ts-ignore
              (ele1) => ele1.id != ele.id,
            )) {
              console.log(ele);
              //@ts-ignore
              data.unshift(ele);
            }
          });
        }

        this.data = data;
        console.log(this.data)
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
        //@ts-ignore
      }
    )
  }
  onSubmit(): void {
    console.log(this.reservationForm.value)
   
    if (this.selection.selected.length > 0) {

      let deviceId: any = []
      this.selection.selected.forEach(ele => {
        deviceId.push(ele.id)
        console.log(deviceId)

      })
      this.reservationForm.controls['deviceIds'].setValue(deviceId)
      console.log(this.reservationForm);
      this.openpopupDialog(this.reservationForm)
    } else {
      this.toastrService.error('Validation!', 'Please select at least one device');
    }


  }


  openpopupDialog(reservationForm: any) {
    console.log("reservationForm");
    console.log(reservationForm)
    this.dialogRef = this.dialog.open(this.popupDialog,
      { data: this.reservationbollean, height: '300px', width: '500px' });
    console.log(this.reservationForm)
    this.dialogRef.afterClosed().subscribe((result: any) => {
      console.log(result);

      this.onContinue(result);

    });
  }
  onContinue(result: any) {
    console.log(this.reservationForm);
    console.log(result);
    this.reservationForm.controls['continueWithReservationIfOneOrMoreDevicesUnavailableForReservation'].setValue(result.continewwithunavilableonedevice);
    this.reservationForm.controls['continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration'].setValue(result.continueWithTCLessDTC);
    console.log(this.reservationForm);
  
    this.authService.PostAuth('device-group', this.reservationForm.value).subscribe({
      next: data => {
        console.log(data)
        this.reservationForm.reset();
        this.selection.clear();
        this.FilterForm.reset();
      //  this.getDeviceListData();
        this.toastrService.success('Successfully!!', 'Reservation');
        this.dialogRef.close();
      },
      error: err => {                          //Error callback
        console.error('error caught in component', err)
        this.toastrService.error('error!', err.error.message);
      }
    });
   
  }
}
