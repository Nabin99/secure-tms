import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  OrganizationResponse, 
  CreateOrganizationDto, 
  UpdateOrganizationDto, 
  OrganizationStats 
} from '@secure-tms/data';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/organizations';

  /**
   * Get the complete organization hierarchy
   */
  getHierarchy(): Observable<OrganizationResponse[]> {
    return this.http.get<OrganizationResponse[]>(`${this.baseUrl}/hierarchy`);
  }

  /**
   * Get organizations accessible to the current user
   */
  getAccessibleOrganizations(): Observable<OrganizationResponse[]> {
    return this.http.get<OrganizationResponse[]>(`${this.baseUrl}/accessible`);
  }

  /**
   * Get organization by ID
   */
  getOrganization(id: string): Observable<OrganizationResponse> {
    return this.http.get<OrganizationResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get organization statistics
   */
  getOrganizationStats(id: string): Observable<OrganizationStats> {
    return this.http.get<OrganizationStats>(`${this.baseUrl}/${id}/stats`);
  }

  /**
   * Create a new organization
   */
  createOrganization(data: CreateOrganizationDto): Observable<OrganizationResponse> {
    return this.http.post<OrganizationResponse>(this.baseUrl, data);
  }

  /**
   * Update an existing organization
   */
  updateOrganization(id: string, data: UpdateOrganizationDto): Observable<OrganizationResponse> {
    return this.http.put<OrganizationResponse>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Delete an organization
   */
  deleteOrganization(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get all parent organizations (level 1)
   */
  getParentOrganizations(): Observable<OrganizationResponse[]> {
    return this.http.get<OrganizationResponse[]>(`${this.baseUrl}/parents`);
  }

  /**
   * Get child organizations for a parent
   */
  getChildOrganizations(parentId: string): Observable<OrganizationResponse[]> {
    return this.http.get<OrganizationResponse[]>(`${this.baseUrl}?parentId=${parentId}`);
  }
}
