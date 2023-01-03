import { Component, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import { AuthbaseService } from '../../auth/authbase.service';
import { Router } from '@angular/router';
//import * as moment from 'moment';
@Component({
  selector: 'app-add-devices',
  templateUrl: './add-devices.component.html',
  styleUrls: ['./add-devices.component.scss']
})
export class AddDevicesComponent {
  myform: FormGroup;
  countrylist: any;
  fuellist: any;
  devicetypelist: any;
  hide = true;
  addmoredetals: any[] = [];
  shownomore: any[] = [];
  showaddmore: any[] = [];
  maxDate = new Date();
  public date: any;
  public sdgblist: any;
  public disabled = false;
  public showSpinners = true;
  public showSeconds = false;
  public touchUi = false;
  public enableMeridian = false;
  // public minDate: moment.Moment;
  //public maxDate: moment.Moment;
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  //public color: ThemePalette = 'primary';
  offteker = ['School', 'HealthFacility', 'Residential', 'Commercial', 'Industrial', 'PublicSector']
  constructor(private fb: FormBuilder, private authService: AuthbaseService, private router: Router) { }

  ngOnInit() {

    this.DisplayList();
    this.DisplaySDGBList();
    this.DisplayfuelList();
    this.DisplaytypeList();
    this.date = new Date();
    this.myform = this.fb.group({

      devices: this.fb.array([
      ])
    })
    this.addmoredetals[0] = false;
    this.showaddmore[0] = true;
    this.shownomore[0] = false;
    this.myform.valueChanges.subscribe(console.log);
    const device = this.fb.group({
      externalId: [null, Validators.required],
      projectName: [null],
      address: [null],
      latitude: [null],
      longitude: [null],
      countryCode: [null, Validators.required],
      fuelCode: [null],
      deviceTypeCode: [null],
      capacity: [null, Validators.required],
      commissioningDate: [new Date(), Validators.required],
      gridInterconnection: true,
      offTaker: [null],
      impactStory: [null],
      data: [null],
      images: [null],
      deviceDescription: [null],
      energyStorage: true,
      energyStorageCapacity: [null],
      qualityLabels: [null],
      SDGBenefits: [new FormControl([])
      ],
      version: ["1.0"]
    })
    this.deviceForms.push(device);
  }

  get deviceForms() {
    return this.myform.get('devices') as FormArray
  }
  onSDGBRemoved(topping: string, i: number) {
    const toppings: any = this.myform.get('devices') as FormArray
    const sdgb = toppings[i].SDGBenefits.value as string[];
    this.removeFirst(sdgb, topping);
    toppings[i].SDGBenefits.setValue(sdgb); // To trigger change detection
  }

  private removeFirst<T>(array: T[], toRemove: T): void {
    const index = array.indexOf(toRemove);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }
  adddevice() {
    const device = this.fb.group({
      externalId: [null, Validators.required],
      projectName: [null],
      address: [null],
      latitude: [null],
      longitude: [null],
      countryCode: [null, Validators.required],
      fuelCode: [null],
      deviceTypeCode: [null],
      capacity: [null, Validators.required],
      commissioningDate: [new Date(), Validators.required],
      gridInterconnection: true,
      offTaker: [null],
      impactStory: [null],
      data: [null],
      images: [null],
      deviceDescription: [null],
      energyStorage: true,
      energyStorageCapacity: [null],
      qualityLabels: [null],
      SDGBenefits: [new FormControl([])
      ],
      version: [1.0]
    })
    this.deviceForms.push(device);
    console.log(this.deviceForms.length);
    this.showaddmore[this.deviceForms.length - 1] = true;
  }

  addmore(i: number) {
    this.addmoredetals[i] = true;
    this.shownomore[i] = true;
    this.showaddmore[i] = false
  }
  nomore(i: number) {
    this.addmoredetals[i] = false;
    this.showaddmore[i] = true;
    this.shownomore[i] = false;
  }
  deletePhone(i: number) {
    this.deviceForms.removeAt(i)
  }
  DisplayList() {

    this.authService.GetAllProducts('countrycode/list').subscribe(
      (data) => {
        // display list in the console 
        console.log(data)
        this.countrylist = data;

      }
    )
  }
  DisplaySDGBList() {

    this.authService.GetAllProducts('sdgbenefit/code').subscribe(
      (data) => {
        // display list in the console 
        console.log(data)
        this.sdgblist = data;

      }
    )
  }
  DisplayfuelList() {

    this.authService.GetAllProducts('device/fuel-type').subscribe(
      (data) => {
        // display list in the console 
        console.log(data)
        this.fuellist = data;

      }
    )
  }
  DisplaytypeList() {

    this.authService.GetAllProducts('device/device-type').subscribe(
      (data) => {
        // display list in the console 
        console.log(data)
        this.devicetypelist = data;

      }
    )
  }
  onSubmit() {
    console.log(this.deviceForms);
   
    this.deviceForms.value.forEach((element: any) => {
      console.log(element);
      this.authService.PostAuth('device', element).subscribe({
        next: data => {
          console.log(data)
        },
        error: err => {                          //Error callback
          console.error('error caught in component', err)
          // this.toastrService.error('login!', 'check your credentials !!');
        }
      });
    })
  }
}
