import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, OperatorFunction, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  handleHttpError<T>(operation: string): OperatorFunction<T, T> {
    return (source: Observable<T>) =>
      source.pipe(
        catchError((error: unknown) => {
          const message = this.buildMessage(operation, error);
          return throwError(() => new Error(message));
        }),
      );
  }

  private buildMessage(operation: string, error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail =
        typeof error.error === 'object' && error.error !== null && 'message' in error.error
          ? String(error.error.message)
          : error.message;
      return `${operation} failed (${error.status}): ${detail}`;
    }

    if (error instanceof Error) {
      return `${operation} failed: ${error.message}`;
    }

    return `${operation} failed`;
  }
}