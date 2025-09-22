import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CreateTaskDto, UpdateTaskDto, TaskResponse } from '@secure-tms/data';
import { EventService } from './event.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private eventService = inject(EventService);

  getTasks(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>('/api/tasks');
  }

  getTask(id: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`/api/tasks/${id}`);
  }

  createTask(task: CreateTaskDto): Observable<TaskResponse> {
    console.log('TaskService: Creating task', task);
    return this.http.post<TaskResponse>('/api/tasks', task).pipe(
      tap((response) => {
        console.log('TaskService: Task created successfully', response);
        this.eventService.emitTaskChange();
      })
    );
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<TaskResponse> {
    return this.http.patch<TaskResponse>(`/api/tasks/${id}`, task).pipe(
      tap(() => this.eventService.emitTaskChange())
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${id}`).pipe(
      tap(() => this.eventService.emitTaskChange())
    );
  }
}
