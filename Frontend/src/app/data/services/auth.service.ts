import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterRequest {
  email: string;
  username: string;
  dateOfBirth: string;
  password?: string;
  hasPlayedBefore: boolean;
}

export interface RegisterResponse {
  id: string;
  email: string;
  username: string;
  dateOfBirth: string;
  hasPlayedBefore: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }
}
