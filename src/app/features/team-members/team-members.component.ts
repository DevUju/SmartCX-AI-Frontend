import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  TeamUser,
  UpdateUserRequest,
  UserRole,
  UserService,
} from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';

type RoleOption = {
  value: UserRole;
  label: string;
};

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './team-members.component.html',
  styleUrl: './team-members.component.css',
})
export class TeamMembersComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly savingMemberId = signal<string | null>(null);
  protected readonly inviting = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly users = signal<TeamUser[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly roleOptions: RoleOption[] = [
    { value: 'agent', label: 'Agent' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
  ];

  protected readonly inviteForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    role: ['agent' as UserRole, [Validators.required]],
    temporaryPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.users();
    }

    return this.users().filter((member) => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      return (
        fullName.includes(term) ||
        member.email.toLowerCase().includes(term) ||
        member.role.toLowerCase().includes(term)
      );
    });
  });

  protected readonly defaultRows = computed(() =>
    this.filteredUsers().map((member) => ({
      ...member,
      roleDraft: member.role,
      onlineDraft: member.isOnline,
    })),
  );

  constructor(
    private readonly userService: UserService,
    private readonly toastService: ToastService,
    private readonly formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  protected setSearch(value: string): void {
    this.searchTerm.set(value);
  }

  protected inviteUser(): void {
    this.inviteForm.markAllAsTouched();
    if (this.inviteForm.invalid || this.inviting()) {
      return;
    }

    this.inviting.set(true);
    this.userService
      .inviteUser(this.inviteForm.getRawValue())
      .pipe(finalize(() => this.inviting.set(false)))
      .subscribe({
        next: () => {
          this.toastService.success('Team member invited successfully.');
          this.inviteForm.reset({
            firstName: '',
            lastName: '',
            email: '',
            role: 'agent',
            temporaryPassword: '',
          });
          this.loadUsers();
        },
        error: (error: Error) => {
          this.toastService.error(error.message);
        },
      });
  }

  protected saveMember(member: TeamUser, role: string, status: string): void {
    if (this.savingMemberId()) {
      return;
    }

    const roleValue = role as UserRole;
    const isOnlineValue = status === 'online';

    const payload: UpdateUserRequest = {
      role: roleValue,
      isOnline: isOnlineValue,
    };

    this.savingMemberId.set(member.id);
    this.userService
      .updateUser(member.id, payload)
      .pipe(finalize(() => this.savingMemberId.set(null)))
      .subscribe({
        next: () => {
          this.toastService.success(`${member.firstName} ${member.lastName} updated.`);
          this.users.update((items) =>
            items.map((item) =>
              item.id === member.id
                ? { ...item, role: roleValue, isOnline: isOnlineValue }
                : item,
            ),
          );
        },
        error: (error: Error) => {
          this.toastService.error(error.message);
        },
      });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.userService
      .listUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          const sorted = [...items].sort((a, b) => {
            if (a.role === b.role) {
              return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
            }
            if (a.role === 'super_admin') return 1;
            if (b.role === 'super_admin') return -1;
            if (a.role === 'admin') return 1;
            if (b.role === 'admin') return -1;
            return 0;
          });
          this.users.set(sorted);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
        },
      });
  }
}
