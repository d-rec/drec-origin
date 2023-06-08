import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import { MeterReadService, DeviceService } from '../../../auth/services';
import { AuthbaseService } from '../../../auth/authbase.service'
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as moment from 'moment';
@Component({
  selector: 'app-addread',
  templateUrl: './addread.component.html',
  styleUrls: ['./addread.component.scss']
})
export class AddreadComponent implements OnInit {
  startmaxDate = new Date();
  startminDate = new Date();
  endminDate = new Date();
  endmaxdate: any;
  historyAge: any;
  devicecreateddate: any;
  readForm: FormGroup;
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  data: any;
  showerror: boolean;
  timezonedata: any = [];
  countrylist: any;
  hidestarttime: boolean = true;
  readtype = ['History', 'Delta', 'Aggregate'];
  unit = ['Wh', 'kWh', 'MWh', 'GWh'];
  commissioningDate: any;
  filteredOptions: Observable<any[]>;
  constructor(private fb: FormBuilder, private readService: MeterReadService,
    private deviceservice: DeviceService,
    private authService: AuthbaseService,
    private router: Router, private toastrService: ToastrService) { }
  ngOnInit() {
    this.readForm = this.fb.group({
      timezone: new FormControl(),
      externalId: [null, Validators.required],
      type: [null, Validators.required],
      unit: [null, Validators.required],

      reads: this.fb.array([
      ])
    })
    const read = this.fb.group({
      starttimestamp: [''],
      endtimestamp: [null, Validators.required],
      value: [null, Validators.required],
    }, {
      validators: (control) => {
        console.log(control);
        if (control.value.starttimestamp > control.value.endtimestamp) {
          console.log('49');
          //@ts-ignore
          control.get("endtimestamp").setErrors({ notSame: true });
        }
        return null;
      },
    })
    this.addreads.push(read);
    this.DisplayList();
    //this.TimeZoneList();
    this.authService.GetMethod('countrycode/list').subscribe(
      (data3) => {
        this.countrylist = data3;  
      }
    )
  
  }
  get addreads() {
    return this.readForm.controls["reads"] as FormArray;
  }
  DisplayList() {
    this.deviceservice.GetMyDevices().subscribe(
      (data) => {
        // display list in the console 
        this.data = data;
      }
    )
  }
  // TimeZoneList() {
  //   this.authService.GetMethod('meter-reads/time-zones').subscribe(
  //     (data) => {
  //       // display list in the console 
  //       this.timezonedata = data;
  //     }
  //   )
  // }
  lastreadvalue: number;
  lastreaddate: any;
  ExternaIdonChangeEvent(event: any) {
    console.log(event);
    this.addreads.reset();
    this.readForm.controls['type'].setValue(null)
    this.devicecreateddate = event.createdAt;
    this.commissioningDate = event.commissioningDate;

    this.historyAge = new Date(this.devicecreateddate);
    this.historyAge.setFullYear(this.historyAge.getFullYear() - 3);
    //@ts-ignore
    this.timezonedata = this.countrylist.find(countrycode => countrycode.alpha3 == event.countryCode)?.timezones;
    console.log(this.timezonedata);
    this.readForm.controls['timezone'].setValue(null);
    this.filteredOptions = this.readForm.controls['timezone'].valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
    console.log(this.filteredOptions);
    this.readService.Getlastread(event.externalId).subscribe({
      next: data => {
        console.log(data),
          this.lastreaddate = data.enddate;
        this.lastreadvalue = data.value;
      },
      error: err => {                      //Error callback
        console.error('error caught in component', err)
      }
    })

  }
  onChangeEvent(event: any) {
    console.log(event);
    if (event === 'Delta' || event === 'Aggregate') {
      this.endmaxdate = new Date();
      this.endminDate = this.devicecreateddate;
      this.hidestarttime = false;
    } else {
      this.startminDate = this.historyAge;
      this.startmaxDate = this.devicecreateddate;
      this.endmaxdate = this.devicecreateddate;
      this.endminDate = this.historyAge;
      this.hidestarttime = true;
    }
  }
  onEndChangeEvent(event: any) {
    console.log(event);
    this.endmaxdate = this.devicecreateddate;
    this.endminDate = event;
  }
  private _filter(value: string): string[] {
    console.log(this.timezonedata)
    const filterValue = value.toLowerCase();
    console.log(filterValue)
    console.log(this.timezonedata.filter((option: any) => option.name.toLowerCase().includes(filterValue)));
    if (!(this.timezonedata.filter((option: any) => option.name.toLowerCase().includes(filterValue)).length > 0)) {
      this.showerror = true;
    }else{
      this.showerror = false;
    }
    
    return this.timezonedata.filter((option: any) => option.name.toLowerCase().includes(filterValue))
  }
  getErrorcheckdatavalidation() {
    return this.readForm.controls["reads"].get('endtimestamp')?.hasError('required') ? 'This field is required' :
      this.readForm.controls["reads"].get('endtimestamp')?.hasError('notSame') ? ' Please add a valid endtimestamp' : '';
  }
  checkValidation(input: string) {
    const validation = this.readForm.controls["reads"].get(input)?.invalid && (this.readForm.controls["reads"].get(input)?.dirty || this.readForm.controls["reads"].get(input)?.touched)
    return validation;
  }
  onSubmit(): void {

    let externalId = this.readForm.value.externalId.externalId;
    console.log(externalId);
    console.log(this.readForm.value);

    const myobj: any = {}
    if ((this.readForm.value.timezone != null && this.readForm.value.timezone != '') && this.readForm.value.type === 'History') {
      myobj['timezone'] = this.readForm.value.timezone
      myobj['type'] = this.readForm.value.type
      myobj['unit'] = this.readForm.value.unit
      let reads: any = []
      this.readForm.value.reads.forEach((ele: any) => {
        reads.push({
          starttimestamp: moment(ele.starttimestamp).format('YYYY-MM-DD HH:mm:ss'),
          endtimestamp: moment(ele.endtimestamp).format('YYYY-MM-DD HH:mm:ss'),
          value: ele.value,
        })
      })
      myobj['reads'] = reads
    } else if ((this.readForm.value.timezone != null && this.readForm.value.timezone != '') && this.readForm.value.type != 'History') {

      myobj['timezone'] = this.readForm.value.timezone
      myobj['type'] = this.readForm.value.type
      myobj['unit'] = this.readForm.value.unit
      let newreads: any = []
      this.readForm.value.reads.forEach((ele: any) => {
        newreads.push({
          starttimestamp: "",
          endtimestamp: moment(ele.endtimestamp).format('YYYY-MM-DD HH:mm:ss'),
          value: ele.value,
        })
      })
      myobj['reads'] = newreads
    } else {
      myobj['type'] = this.readForm.value.type
      myobj['unit'] = this.readForm.value.unit
      let newreads: any = []
      this.readForm.value.reads.forEach((ele: any) => {
        newreads.push({
          starttimestamp: ele.starttimestamp,
          endtimestamp: ele.endtimestamp,
          value: ele.value,
        })
      })
      myobj['reads'] = newreads
    }
    this.readService.PostRead(externalId, myobj).subscribe({
      next: (data: any) => {
        console.log(data)
        this.readForm.reset();
        this.toastrService.success('Successfully!', 'Read Added!!');
      },
      error: (err: { error: { message: string | undefined; }; }) => {                          //Error callback
        console.error('error caught in component', err)
        this.toastrService.error('error!', err.error.message);
      }
    });
  }

}
