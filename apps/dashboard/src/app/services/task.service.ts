import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTaskDto, UpdateTaskDto, TaskResponse } from '@secure-tms/data';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);

  getTasks(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>('/api/tasks');
  }

  getTask(id: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`/api/tasks/${id}`);
  }

  createTask(task: CreateTaskDto): Observable<TaskResponse> {
    return this.http.post<TaskResponse>('/api/tasks', task);
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<TaskResponse> {
    return this.http.patch<TaskResponse>(`/api/tasks/${id}`, task);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${id}`);
  }
}
