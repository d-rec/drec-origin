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
  energyStorage: any;
  energyStorageCapacity: any;

  offteker = ['School', 'HealthFacility', 'Residential', 'Commercial', 'Industrial', 'PublicSector', 'Agriculture']
  devicediscription = ['Solar Lantern', 'Solar Home System', 'Mini Grid', 'Rooftop Solar', 'Ground Mount Solar'];

  constructor(private fb: FormBuilder, private authService: AuthbaseService,
    private deviceService: DeviceService, private router: Router,
    private toastrService: ToastrService, private activatedRoute: ActivatedRoute,) {
    this.activatedRoute.queryParams.subscribe(params => {
      this.externalid = params['id'];


    });
  }

  ngOnInit() {

    this.DisplayList();
    this.DisplaySDGBList();
    this.DisplayfuelList();
    this.DisplaytypeList();
    this.getDeviceinfo();
    this.date = new Date();
    this.myform = this.fb.group({
      externalId: [null, Validators.required],
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
      energyStorage: [true],
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

  DisplayList() {

    this.authService.GetMethod('countrycode/list').subscribe(
      (data) => {
        // display list in the console 
        console.log(data)
        this.countrylist = data;

      }
    )
  }
  DisplaySDGBList() {

    this.authService.GetMethod('sdgbenefit/code').subscribe(
      (data) => {
        // display list in the console 
        console.log(data)
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
       
        this.id = data.id
        this.externalId = data.externalId
        this.status = data.status
        this.projectName = data.projectName
        this.address = data.address
        this.latitude = data.latitude
        this.longitude = data.longitude
        this.countryCode = data.countryCode
        this.fuelCode = data.fuelCode
        this.deviceTypeCode = data.deviceTypeCode
        this.capacity = data.capacity
        data.SDGBenefits.forEach(
          (sdgbname: string, index: number) => {
            //@ts-ignore
            let foundEle = this.sdgblist.find(ele => ele.value.toLowerCase() === sdgbname.toString().toLowerCase());          
              data.SDGBenefits[index] = foundEle.name           
            console.log(data.SDGBenefits);
          });
          this.SDGBenefits =data.SDGBenefits;          
        this.commissioningDate = data.commissioningDate
        this.offTaker = data.offTaker
        this.qualityLabels = data.qualityLabels
        this.impactStory = data.impactStory
        this.gridInterconnection = data.gridInterconnection
        this.deviceDescription = data.deviceDescription
        this.energyStorage = data.energyStorage
        this.energyStorageCapacity = data.energyStorageCapacity


      })

  }
  onSubmit() {
    console.log(this.myform);

    // this.deviceForms.value.forEach((element: any) => {
    console.log(this.myform);
    this.deviceService.Patchdevices(this.id, this.myform.value).subscribe({
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
