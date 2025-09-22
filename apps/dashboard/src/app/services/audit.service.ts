import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '@secure-tms/data';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private http = inject(HttpClient);

  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>('/api/audit-log');
  }
}
