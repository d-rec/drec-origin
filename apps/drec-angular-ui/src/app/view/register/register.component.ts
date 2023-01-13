import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, FormGroupDirective, } from '@angular/forms';
import { AuthbaseService } from '../../auth/authbase.service';
import { Router } from '@angular/router';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true },
    },
  ],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  fieldRequired: string = "This field is required"
  orgtype: any[] = [
    { value: 'Developer', viewValue: 'Developer' },
    { value: 'Buyer', viewValue: 'Buyer' }
  ];
  hide = true;
  hide1 = true;
  matchconfirm: boolean = false;

  emailregex: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  constructor(private authService: AuthbaseService, private _formBuilder: FormBuilder,
    private toastrService: ToastrService,) {

  }


  ngOnInit() {
    this.createForm();
  }
  createForm() {

    this.registerForm = new FormGroup(
      {
        firstName: new FormControl(null, [Validators.required]),
        lastName: new FormControl(null, [Validators.required]),
        orgName: new FormControl(null, [Validators.required]),
        organizationType: new FormControl(null),
        orgAddress: new FormControl(null),
        email: new FormControl(null, [Validators.required, Validators.pattern(this.emailregex)]),
        password: new FormControl(null, [Validators.required, this.checkPassword]),
        confirmPassword: new FormControl("", [Validators.required, this.checkconfirmPassword]),
        secretKey: new FormControl(null, [Validators.required, this.checksecretKey]),
      },
      {
        validators: (control) => {
          console.log(control)
          if (control.value.password !== control.value.confirmPassword) {
            //@ts-ignore
            control.get("confirmPassword").setErrors({ notSame: true });
          }
          return null;
        },
      }
    );


  }
  emaiErrors() {
    return this.registerForm.get('email')?.hasError('required') ? 'This field is required' :
      this.registerForm.get('email')?.hasError('pattern') ? 'Not a valid emailaddress' : ''

  }
  checkPassword(control: any) {
    let enteredPassword = control.value
    let passwordCheck = /((?=.*[0-9])(?=.*[A-Za-z]).{6,})/;
    return (!passwordCheck.test(enteredPassword) && enteredPassword) ? { 'requirements': true } : null;
  }
  getErrorPassword() {
    return this.registerForm.get('password')?.hasError('required') ? 'This field is required (Password must contain minimum 6 characters (upper and/or lower case) and at least one number)' :
      this.registerForm.get('password')?.hasError('requirements') ? '(Password must contain minimum 6 characters (upper and/or lower case) and at least one number)' : '';
  }
  checkconfirmPassword(control: any) {
   // console.log(this.registerForm.value)
    console.log(control)
    let enteredPassword = control.value;;
    let passwordCheck = /((?=.*[0-9])(?=.*[A-Za-z]).{6,})/;
    console.log(enteredPassword);
   // console.log(this.registerForm.value.password);
   //this.registerForm.value.password = this.registerForm.value.password?:'';
    return (!passwordCheck.test(enteredPassword) && enteredPassword) ? { 'Confirmrequirements': true } :
      (!enteredPassword && enteredPassword) ? { 'matchrequirements': true } : null;
  }
  getErrorcheckconfirmPassword() {
    return this.registerForm.get('confirmPassword')?.hasError('required') ? 'This field is required (Password must contain minimum 6 characters (upper and/or lower case) and at least one number)' :
      this.registerForm.get('confirmPassword')?.hasError('Confirmrequirements') ? '(Password must contain minimum 6 characters (upper and/or lower case) and at least one number)' :
      this.registerForm.get('confirmPassword')?.hasError('notSame') ? ' confirmPassword Does not match': '';
  }

  checksecretKey(control: any) {
    let enteredsecretKey = control.value
    let secretKeyCheck = /^(?=.*\d)(?=.*[A-Z])[A-Z0-9]{6}$/;
    return (!secretKeyCheck.test(enteredsecretKey) && enteredsecretKey) ? { 'keyrequirements': true } : null;
  }
  getErrorsecretKey() {
    return this.registerForm.get('secretKey')?.hasError('required') ? 'Secret key should be of 6 characters length and consist of minimum one upper case and minimum one digit, and combination should include only A-Z upper case and 0-9 numbers. please enter valid secret key' :
      this.registerForm.get('secretKey')?.hasError('keyrequirements') ? 'Secret key should be of 6 characters length and consist of minimum one upper case and minimum one digit, and combination should include only A-Z upper case and 0-9 numbers. please enter valid secret key' : '';
  }
  checkValidation(input: string) {
    const validation = this.registerForm.get(input)?.invalid && (this.registerForm.get(input)?.dirty || this.registerForm.get(input)?.touched)
    return validation;
  }
  onSubmit(formData: FormGroup): void {
    console.log(this.registerForm.value)
    // const email = formData.value.email;
    // const password = formData.value.password;
    // const username = formData.value.username;
    //this.auth.post(email, password, username);
    this.authService.PostAuth('user/registerWithOrganization', this.registerForm.value).subscribe({
      next: data => {
        console.log(data)
        this.registerForm.reset();
        this.toastrService.success('Successfully!', 'Rgistration!!');
      },
      error: err => {                          //Error callback
        console.error('error caught in component', err)
        this.toastrService.error('error!', err.error.message);
      }
    });
    // formDirective.resetForm();

  }
}
