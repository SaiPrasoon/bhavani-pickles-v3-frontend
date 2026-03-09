import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly base = `${environment.apiUrl}/upload`;

  constructor(private http: HttpClient) {}

  uploadImages(files: File[], folder = 'products'): Observable<{ urls: string[] }> {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    return this.http.post<{ urls: string[] }>(`${this.base}/images?folder=${folder}`, fd);
  }
}
