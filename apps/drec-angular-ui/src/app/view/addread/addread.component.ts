import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import { MeterReadService, DeviceService } from '../../auth/services';
import { AuthbaseService } from '../../auth/authbase.service'
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
  endminDate=new Date();
  endmaxdate:any;
  historyAge:any;
  devicecreateddate:any;
  readForm: FormGroup;
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  data: any;
  timezonedata: any = [];
  hidestarttime: boolean = true;
  readtype = ['History', 'Delta', 'Aggregate'];
  unit = ['Wh', 'kWh', 'MWh', 'GWh'];
  options: string[] = ['One', 'Two', 'Three'];
  filteredOptions: Observable<string[]>;
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
    this.TimeZoneList();
    this.readForm.controls['timezone'];
    this.filteredOptions = this.readForm.controls['timezone'].valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }
  get addreads() {
    return this.readForm.controls["reads"] as FormArray;
  }
  DisplayList() {
    this.deviceservice.GetMyDevices().subscribe(
      (data) => {
        // display list in the console 
        console.log(data);
        this.data = data;
      }
    )
  }
  TimeZoneList() {
    this.authService.GetMethod('meter-reads/time-zones').subscribe(
      (data) => {
        // display list in the console 
        console.log(data);
        this.timezonedata = data;
      }
    )
  }
  onChangeDateEvent(event:any){
    console.log(event);
    this.devicecreateddate=event.createdAt;
    this.historyAge = new Date(this.devicecreateddate);
    this.historyAge.setFullYear(this.historyAge.getFullYear() - 3);
    //  2022-11-04T08:20:37.140Z
    //this.readForm.controls["externalId"]=event.externalId;
      console.log(this.historyAge);
      this.readForm.controls["read"]

  }
  onChangeEvent(event: any) {
    console.log(event);
    if (event === 'Delta' || event === 'Aggregate') {
      this.endmaxdate=new Date();
      this.endminDate=this.devicecreateddate;
      this.hidestarttime = false;
     

    } else {
      this.startminDate= this.historyAge;
      this.startmaxDate=this.devicecreateddate;
      this.endmaxdate=this.devicecreateddate;
      this.endminDate=this.historyAge;
      this.hidestarttime = true;
    }
  }
  onEndChangeEvent(event: any) {
   console.log(event);
     // this.startminDate= this.historyAge;
      //this.startmaxDate=this.devicecreateddate;
      this.endmaxdate=this.devicecreateddate;
      this.endminDate=event;
      //this.hidestarttime = true;
    
  }
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.timezonedata.filter((option: string) => option.toLowerCase().includes(filterValue));
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
    const myobj: any = {}
    if (this.readForm.value.timezone != null && this.readForm.value.type === 'History') {
      myobj['timezone'] = this.readForm.value.timezone
      myobj['type'] = this.readForm.value.type
      myobj['unit'] = this.readForm.value.unit
      let reads:any = []
      this.readForm.value.reads.forEach((ele: any) => {
        reads.push({
          starttimestamp: moment(ele.starttimestamp).format('YYYY-MM-DD HH:mm:ss'),
          endtimestamp: moment(ele.endtimestamp).format('YYYY-MM-DD HH:mm:ss'),
          value: ele.value,
        })
      })
      myobj['reads'] = reads
    } else if(this.readForm.value.timezone != null && this.readForm.value.type!= 'History'){
      myobj['timezone'] = this.readForm.value.timezone
      myobj['type'] = this.readForm.value.type
      myobj['unit'] = this.readForm.value.unit
      let newreads:any = []
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
      let newreads:any = []
      this.readForm.value.reads.forEach((ele: any) => {
        newreads.push({
          starttimestamp: ele.starttimestamp,
          endtimestamp: ele.endtimestamp,
          value: ele.value,
        })
      })
      myobj['reads'] = newreads
    }  
    this.readService.PostRead(externalId,myobj).subscribe({
      next: (data: any) => {
        console.log(data)
        this.readForm.reset();
        this.toastrService.success('Successfully!', 'Read Add SuccessFully!!');
      },
      error: (err: { error: { message: string | undefined; }; }) => {                          //Error callback
        console.error('error caught in component', err)
        this.toastrService.error('error!', err.error.message);
      }
    });
  }

}
