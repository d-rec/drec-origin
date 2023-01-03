import { Component,OnInit } from '@angular/core';
import { FormGroup , FormControl,Validators,FormGroupDirective} from '@angular/forms';
import {AuthbaseService} from '../../auth/authbase.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit{
  registerForm: FormGroup;
  fieldRequired: string = "This field is required"
  foods: any[] = [
    {value: 'steak-0', viewValue: 'Steak'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos'},
  ];
   constructor(private auth: AuthbaseService) { }
 
   ngOnInit() {
     this.createForm();
   }
   createForm(){
       let emailregex: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
     this.registerForm = new FormGroup(
       {'first': new FormControl(null,[Validators.required]),
       'lastname': new FormControl(null,[Validators.required]),
       'orgName': new FormControl(null,[Validators.required]),
       'organizationType': new FormControl(null),
       'orgAddress': new FormControl(null),
       'email': new FormControl(null,[Validators.required, Validators.pattern(emailregex)]),
       'password': new FormControl(null, [Validators.required, this.checkPassword]),
       'confirmPassword': new FormControl(null, [Validators.required, this.checkPassword]),
       'secretKey': new FormControl(null,[Validators.required,this.checksecretKey]),
      }
     )
   
 
   }
     emaiErrors() {
      return this.registerForm.get('email')?.hasError('required')?'This field is required' :
      this.registerForm.get('email')?.hasError('pattern')? 'Not a valid emailaddress' :''
    
   }
 checkPassword(control:any) {
     let enteredPassword = control.value
     let passwordCheck = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})/;
     return (!passwordCheck.test(enteredPassword) && enteredPassword) ? { 'requirements': true } : null;
   }
  
   getErrorPassword() {
     return this.registerForm.get('password')?.hasError('required') ? 'This field is required (Password must contain minimum 6 characters (upper and/or lower case) and at least one number)' :
       this.registerForm.get('password')?.hasError('requirements') ? '(Password must contain minimum 6 characters (upper and/or lower case) and at least one number)' : '';
   }
   checksecretKey(control:any) {
    let enteredsecretKey = control.value
    let secretKeyCheck = /^(?=.*\d)(?=.*[A-Z])[A-Z0-9]{6}$/;
    return (!secretKeyCheck.test(enteredsecretKey) && enteredsecretKey) ? { 'requirements': true } : null;
  }
  getErrorsecretKey() {
    return this.registerForm.get('secretKey')?.hasError('required') ? 'Secret key should be of 6 characters length and consist of minimum one upper case and minimum one digit, and combination should include only A-Z upper case and 0-9 numbers. please enter valid secret key' :
      this.registerForm.get('secretKey')?.hasError('requirements') ? 'Secret key should be of 6 characters length and consist of minimum one upper case and minimum one digit, and combination should include only A-Z upper case and 0-9 numbers. please enter valid secret key' : '';
  }
   checkValidation(input: string){
     const validation = this.registerForm.get(input)?.invalid && (this.registerForm.get(input)?.dirty || this.registerForm.get(input)?.touched)
     return validation;
   }
   onSubmit(formData: FormGroup, formDirective: FormGroupDirective): void {
   
    const email = formData.value.email;
    const password = formData.value.password;
    const username = formData.value.username;
    //this.auth.post(email, password, username);
     formDirective.resetForm();
    this.registerForm.reset();
}
}
