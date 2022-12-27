import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders, HttpErrorResponse} from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class AuthbaseService {
  url: String = 'https://dev-api.drecs.org/api/';
  constructor(private httpClient:HttpClient) { }

//   lohinhttpOptions() {
//     var reqHeader: any;
//     reqHeader = new HttpHeaders({
//         'Content-Type': 'application/json',
//         'authorization': sessionStorage.getItem('token')

//     })
//     return { headers: reqHeader };
// };
  login(routePath: string, data: any){
    //let json = {username:username,password:password}
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
    console.log(sessionStorage.getItem('access-token'));
    const user = sessionStorage.getItem('access-token');
    console.log(user);
    if (user) {
      return true;
    }

    return false;
  }
}
