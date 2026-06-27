import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, tap } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { ErrorService } from './error.service';

export type Customer = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  channel: 'whatsapp' | 'instagram' | 'email';
  totalSpent: number;
  location: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly customerCache = new Map<string, Customer>();
  private readonly cacheTimestamps = new Map<string, number>();
  private readonly STALE_MS = 5 * 60 * 1000; // 5 minutes
  private hasLoadedAll = false;
  private allLoadedAt = 0;

  constructor(
    private readonly http: HttpClient,
    private readonly errorService: ErrorService,
  ) {}

  listCustomers(search?: string): Observable<Customer[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http
      .get<Customer[]>(`${API_BASE_URL}/customers`, { params })
      .pipe(this.errorService.handleHttpError<Customer[]>('List customers'));
  }

  getCustomerById(id: string): Observable<Customer> {
    const cached = this.customerCache.get(id);
    const ts = this.cacheTimestamps.get(id) ?? 0;
    if (cached && Date.now() - ts < this.STALE_MS) {
      return of(cached);
    }

    return this.http.get<Customer>(`${API_BASE_URL}/customers/${id}`).pipe(
      tap((customer) => {
        this.customerCache.set(customer.id, customer);
        this.cacheTimestamps.set(customer.id, Date.now());
      }),
      this.errorService.handleHttpError<Customer>('Get customer'),
    );
  }

  ensureCustomers(ids: string[]): Observable<Map<string, Customer>> {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return of(new Map<string, Customer>());
    }

    const now = Date.now();
    const allCacheStale = this.hasLoadedAll && (now - this.allLoadedAt > this.STALE_MS);
    const missingIds = uniqueIds.filter((id) => {
      const ts = this.cacheTimestamps.get(id) ?? 0;
      return !this.customerCache.has(id) || (now - ts > this.STALE_MS);
    });

    if (missingIds.length === 0) {
      return of(this.snapshot(uniqueIds));
    }

    if (!this.hasLoadedAll || allCacheStale) {
      return this.listCustomers().pipe(
        tap((customers) => {
          customers.forEach((customer) => {
            this.customerCache.set(customer.id, customer);
            this.cacheTimestamps.set(customer.id, now);
          });
          this.hasLoadedAll = true;
          this.allLoadedAt = now;
        }),
        map(() => this.snapshot(uniqueIds)),
      );
    }

    return forkJoin(missingIds.map((id) => this.getCustomerById(id))).pipe(
      map(() => this.snapshot(uniqueIds)),
    );
  }

  private snapshot(ids: string[]): Map<string, Customer> {
    const mapById = new Map<string, Customer>();
    ids.forEach((id) => {
      const customer = this.customerCache.get(id);
      if (customer) {
        mapById.set(id, customer);
      }
    });
    return mapById;
  }
}
