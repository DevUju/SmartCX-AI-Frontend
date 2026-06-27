import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Unauthorized - redirect to login
        router.navigate(['/login']);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (error.status === 403) {
        // Forbidden
        console.error('Forbidden:', error);
      } else if (error.status === 404) {
        // Not Found
        console.error('Not Found:', error);
      } else if (error.status === 500) {
        // Server Error
        console.error('Server Error:', error);
      }

      return throwError(() => error);
    })
  );
};
