import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import { AuthbaseService } from '../../../auth/authbase.service';
import { DeviceService } from '../../../auth/services/device.service'
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-device',
  templateUrl: './edit-device.component.html',
  styleUrls: ['./edit-device.component.scss']
})
export class EditDeviceComponent implements OnInit {

  myform: FormGroup;
  countrylist: any;
  fuellist: any;
  devicetypelist: any;
  numberregex: RegExp = /[0-9]+(\.[0-9]*){0,1}/;
  maxDate = new Date();
  public date: any;
  addmoredetals: any;
  shownomore: any;
  showaddmore: any;
  public sdgblist: any;
  id:number;
  externalid: any;
  showinput: boolean = true;
  externalId: any;
  status: any;
  projectName: any;
  address: any;
  latitude: any;
  longitude: any;
  countryCode: any;
  fuelCode: any;
  deviceTypeCode: any;
  capacity: any;
  SDGBenefits: any=[];
  commissioningDate: any;
  qualityLabels: any;
  offTaker: any;
  gridInterconnection: any;
  impactStory: any;

  deviceDescription: any;
  energyStorage: boolean=true;
  energyStorageCapacity: any;

  offteker = ['School', 'HealthFacility', 'Residential', 'Commercial', 'Industrial', 'PublicSector', 'Agriculture']
  devicediscription = ['Solar Lantern', 'Solar Home System', 'Mini Grid', 'Rooftop Solar', 'Ground Mount Solar'];

  constructor(private fb: FormBuilder, private authService: AuthbaseService,
    private deviceService: DeviceService, private router: Router,
    private toastrService: ToastrService, private activatedRoute: ActivatedRoute,) {
    // this.activatedRoute.queryParams.subscribe(params => {
    //   this.externalid = params['id'];
    // });
    this.externalid = this.activatedRoute.snapshot.params['id'];
  }

  ngOnInit() {

    this.DisplayList();
    this.DisplaySDGBList();
    this.DisplayfuelList();
    this.DisplaytypeList();
    this.getDeviceinfo();
    this.date = new Date();
    this.myform = this.fb.group({
      externalId: [null, [Validators.required, Validators.pattern(/^[a-zA-Z\d\-_\s]+$/)]],
      //newexternalId: [null, Validators.required],
      projectName: [null],
      address: [null],
      latitude: [null, Validators.pattern(this.numberregex)],
      longitude: [null, Validators.pattern(this.numberregex)],
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
      energyStorage: [],
      energyStorageCapacity: [null],
      qualityLabels: [null],
      SDGBenefits: [new FormControl([])
      ],
      version: ["1.0"]

    })
    this.showinput = true;
    this.addmoredetals = false;
    this.showaddmore = true;
    this.shownomore = false;
    this.myform.valueChanges.subscribe(console.log);


  }
 checkValidation(input: string) {
    const validation = this.myform.get(input)?.invalid && (this.myform.get(input)?.dirty || this.myform.get(input)?.touched)
    return validation;
  }
  emaiErrors() {
    return this.myform.get('externalId')?.hasError('required') ? 'This field is required' :
      this.myform.get('externalId')?.hasError('pattern') ? 'external id can contain only alphabets( lower and upper case included), numeric(0 to 9), hyphen(-), underscore(_) and spaces in between' : ''

  }
  DisplayList() {

    this.authService.GetMethod('countrycode/list').subscribe(
      (data1) => {
        // display list in the console 
        console.log(data1)
        this.countrylist = data1;

      }
    )
  }
  DisplaySDGBList() {

    this.authService.GetMethod('sdgbenefit/code').subscribe(
      (data2) => {
        // display list in the console 
        console.log(data2)
        this.sdgblist = data2;

      }
    )
  }
  DisplayfuelList() {

    this.authService.GetMethod('device/fuel-type').subscribe(
      (data3) => {
        // display list in the console 

        this.fuellist = data3;

      }
    )
  }
  DisplaytypeList() {

    this.authService.GetMethod('device/device-type').subscribe(
      (data4) => {
        // display list in the console 

        this.devicetypelist = data4;

      }
    )
  }
  shownewExternalidInput:boolean=false;
  showcancelicon:boolean=false;
  editExternalid(){
    this.shownewExternalidInput=true;
    this.showcancelicon=true;
  }
  hideeditExternalid(){
    this.shownewExternalidInput=false;
    this.myform.value.externalId=this.externalId;
    this.showcancelicon=false;
    console.log(this.myform);
  }
  addmore() {
    this.addmoredetals = true;
    this.shownomore = true;
    this.showaddmore = false
  }
  nomore() {
    this.addmoredetals = false;
    this.showaddmore = true;
    this.shownomore = false;
  }
  showenergycapacity_input(event: any) {
    console.log(event)
    if (event) {
      this.showinput = true;
    } else {
      this.showinput = false;
    }
  }
  getDeviceinfo() {
    this.deviceService.getDeviceInfoBYexternalId(this.externalid).subscribe(
      (data) => {
       console.log(data);
        this.id = data.id;
        this.externalId = data.externalId;
        this.status = data.status;
        this.projectName = data.projectName;
        this.address = data.address;
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.countryCode = data.countryCode;
        this.fuelCode = data.fuelCode;
        this.deviceTypeCode = data.deviceTypeCode;
        this.capacity = data.capacity;
        data.SDGBenefits.forEach(
          (sdgbname: string, index: number) => {
            //@ts-ignore
            let foundEle = this.sdgblist.find(ele => ele.value.toLowerCase() === sdgbname.toString().toLowerCase());          
              data.SDGBenefits[index] = foundEle.name           
            console.log(data.SDGBenefits);
          });
          this.SDGBenefits =data.SDGBenefits;          
        this.commissioningDate = data.commissioningDate;
        this.offTaker = data.offTaker;
        this.qualityLabels = data.qualityLabels;
        this.impactStory = data.impactStory;
        this.gridInterconnection = data.gridInterconnection;
        this.deviceDescription = data.deviceDescription;
        this.energyStorage = data.energyStorage;
        console.log(this.energyStorage);
        this.energyStorageCapacity = data.energyStorageCapacity;


      })

  }
  onSubmit() {
   
    console.log(this.myform);
    if(this.myform.value.externalId===null){
      this.myform.value.externalId=this.externalId;
    }
    console.log(this.myform);
    this.deviceService.Patchdevices(this.externalid, this.myform.value).subscribe({
      next: (data: any) => {
        console.log(data)
        // this.deviceForms.reset();
        this.toastrService.success('Update Successfully !!', 'Device! ' + this.myform.value.externalId);
        this.router.navigate(['device/AllList']);
      },
      error: (err: any): void => {                          //Error callback
        console.error('error caught in component', err.error.message)
        this.toastrService.error('some error occurred in add due to ' + err.error.message, 'Device!' + this.myform.value.externalId,);
      }
    });
    // })
  }
}
