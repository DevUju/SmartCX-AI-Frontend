import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPersona } from './user-persona';

describe('UserPersona', () => {
  let component: UserPersona;
  let fixture: ComponentFixture<UserPersona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPersona]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPersona);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
