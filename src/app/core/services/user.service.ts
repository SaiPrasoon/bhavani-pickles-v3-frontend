import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User, Address } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getProfile() {
    return this.http.get<User>(`${this.base}/me`);
  }

  updateProfile(data: { name?: string; phone?: string }) {
    return this.http.patch<User>(`${this.base}/me`, data);
  }

  addAddress(address: Omit<Address, '_id'>) {
    return this.http.post<User>(`${this.base}/me/addresses`, address);
  }

  deleteAddress(addressId: string) {
    return this.http.delete<User>(`${this.base}/me/addresses/${addressId}`);
  }

  setDefaultAddress(addressId: string) {
    return this.http.patch<User>(`${this.base}/me/addresses/${addressId}/default`, {});
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch<void>(`${this.base}/me/change-password`, { currentPassword, newPassword });
  }
}
