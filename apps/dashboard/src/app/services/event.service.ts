import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private taskChangedSubject = new Subject<void>();
  
  // Observable that components can subscribe to
  taskChanged$ = this.taskChangedSubject.asObservable();
  
  // Method to emit task change events
  emitTaskChange(): void {
    this.taskChangedSubject.next();
  }
}
