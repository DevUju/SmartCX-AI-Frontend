import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userData: any = null;

  setUser(data: any) {
    this.userData = data;
  }

  getUser() {
    return this.userData;
  }
}
