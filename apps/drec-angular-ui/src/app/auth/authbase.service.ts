import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders, HttpErrorResponse} from '@angular/common/http';
import {environment} from '../../environments/environment.dev'
@Injectable({
  providedIn: 'root'
})
export class AuthbaseService {
  url: String = environment.API_URL;
  constructor(private httpClient:HttpClient) { }

  login(routePath: string, data: any){
  
    return this.httpClient.post<any>(this.url + routePath, data)
  }


  public PostAuth(routePath: string, data: any) {
    return this.httpClient.post<any>(this.url + routePath, data)

}


// getMethod(routePath: string) {
//   return this.http.get(this.url + urlExtension).pipe(map(res => {
//       return res;
//   })).catch((error) => {
//       if (error.status == "401") {
//           this.router.navigate(['/login']);
//       } else {
//           return throwError(error.message || 'Internal Server error')

//       }
//   })
// }

  GetAllProducts(routePath: string){
    return this.httpClient.get(this.url + routePath)
  }

   isLoggedIn(): boolean {
   
    const user = sessionStorage.getItem('access-token');
  
    if (user) {
      return true;
    }

    return false;
  }
}
