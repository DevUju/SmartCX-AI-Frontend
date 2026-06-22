import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingSchedule } from './upcoming-schedule';

describe('UpcomingSchedule', () => {
  let component: UpcomingSchedule;
  let fixture: ComponentFixture<UpcomingSchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingSchedule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpcomingSchedule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
