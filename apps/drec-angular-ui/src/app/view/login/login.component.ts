import { Input, Component, Output, EventEmitter  } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import {AuthbaseService} from '../../auth/authbase.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl(''),
  });
 // loginForm: FormGroup;
  constructor(private authService:AuthbaseService, private router: Router,) {
         
  }
  // submit() {
  //   if (this.form.valid) {
  //     this.submitEM.emit(this.form.value);
  //   }
  // }

  onSubmit(){
    this.authService.login('auth/login',this.loginForm.value).subscribe(
      (data)=>{
      console.log(data);
       if(data["accessToken"] != null){
         // retreive the access token from the server
      console.log(data["accessToken"])
       // store the token in the localStorage 
       //localStorage.setItem("access-token",data["accessToken"]);
       //this.authService.isLoggedIn();
       sessionStorage.setItem('access-token',data["accessToken"]);
       this.router.navigate(['/myreservation']);
       }else{
         console.log("check your credentials !!")
       }
      }
    )
  }
  //@Input() error: string | null;

  @Output() submitEM = new EventEmitter();
}
