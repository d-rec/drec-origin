import { Component, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import {  AuthbaseService} from '../../../auth/authbase.service';
import { DeviceService } from '../../../auth/services/device.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
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
 numberregex: RegExp =/[0-9]+(\.[0-9]*){0,1}/
  //public color: ThemePalette = 'primary';
  offtaker = ['School', 'HealthFacility', 'Residential', 'Commercial', 'Industrial', 'PublicSector', 'Agriculture']
  devicedescription = ['Solar Lantern', 'Solar Home System', 'Mini Grid', 'Rooftop Solar', 'Ground Mount Solar'];
  constructor(private fb: FormBuilder, private authService: AuthbaseService,private deviceService: DeviceService, private router: Router, private toastrService: ToastrService) { }

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
    this.showinput[0] = true;
    this.addmoredetals[0] = false;
    this.showaddmore[0] = true;
    this.shownomore[0] = false;
    this.myform.valueChanges.subscribe(console.log);
    const device = this.fb.group({
      externalId: [null, [Validators.required, Validators.pattern(/^[a-zA-Z\d\-_\s]+$/)]],
      projectName: [null],
      address: [null],
      latitude: [null,Validators.pattern(this.numberregex)],
      longitude: [null,Validators.pattern(this.numberregex)],
      countryCode: [null, Validators.required],
      fuelCode: [null],
      deviceTypeCode: [null],
      capacity: [null, Validators.required],
      commissioningDate: [new Date(), Validators.required],
      gridInterconnection: [true],
      offTaker: [null],
      impactStory: [null],
      data: [null],
      images: [null],
      deviceDescription: [null],
      energyStorage: [true],
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
  // checkValidation(input: string) {
  //   const validation = this.deviceForms.get(input)?.invalid && (this.deviceForms.get(input)?.dirty || this.deviceForms.get(input)?.touched)
  //   return validation;
  // }
  // emaiErrors() {
  //   return this.myform.get('device').get('externalId')?.hasError('required') ? 'This field is required' :
  //     this.myform.get('email')?.hasError('pattern') ? 'Not a valid emailaddress' : ''

  // }
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
      externalId: [null, [Validators.required, Validators.pattern(/^[a-zA-Z\d\-_\s]+$/)]],
      projectName: [null],
      address: [null],
      latitude: [null,Validators.pattern(this.numberregex)],
      longitude: [null,Validators.pattern(this.numberregex)],
      countryCode: [null, Validators.required],
      fuelCode: [null],
      deviceTypeCode: [null],
      capacity: [null, Validators.required],
      commissioningDate: [new Date(), Validators.required],
      gridInterconnection: true,
      offTaker: [null],
      impactStory: [null],
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
    console.log(this.deviceForms.length);
    this.showaddmore[this.deviceForms.length - 1] = true;
    this.showinput[this.deviceForms.length - 1] = true;
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
  showinput: any[] = [];
  showenergycapacity_input(i: number, event: any) {
    console.log(event)
    if (event) {
      this.showinput[i] = true;
    } else {
      this.showinput[i] = false;
    }
  }
  deletePhone(i: number) {
    this.deviceForms.removeAt(i)
  }
  DisplayList() {

    this.authService.GetMethod('countrycode/list').subscribe(
      (data) => {
        // display list in the console 
        this.countrylist = data;

      }
    )
  }
  DisplaySDGBList() {

    this.authService.GetMethod('sdgbenefit/code').subscribe(
      (data) => {
        // display list in the console 
        
        this.sdgblist = data;

      }
    )
  }
  DisplayfuelList() {

    this.authService.GetMethod('device/fuel-type').subscribe(
      (data) => {
        // display list in the console 

        this.fuellist = data;

      }
    )
  }
  DisplaytypeList() {

    this.authService.GetMethod('device/device-type').subscribe(
      (data) => {
        // display list in the console 

        this.devicetypelist = data;

      }
    )
  }
  onSubmit() {
  
    const formArray = this.myform.get('devices') as FormArray;
    this.deviceForms.value.forEach((element: any,index:number) => {
     
      this.deviceService.Postdevices(element).subscribe({
        next: data => {
         
          const formGroup = formArray.at(index);
          // this.deviceForms.reset();
          this.toastrService.success('Added Successfully !!', 'Device! ' + element.externalId);
          formGroup.reset();
          while (formArray.length > 1) {
            formArray.removeAt(1);
          }
        
         
        },
        error: err => {                          //Error callback
          console.error('error caught in component', err.error.message)
          this.toastrService.error('some error occurred in add due to ' + err.error.message, 'Device!' + element.externalId,);
        }
      });
    })
  }
}
