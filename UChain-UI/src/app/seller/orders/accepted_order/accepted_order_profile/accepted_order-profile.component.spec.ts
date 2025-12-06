import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AcceptedOrderProfileComponent } from './accepted_order-profile.component';

describe('AcceptedOrderProfileComponent', () => {
  let component: AcceptedOrderProfileComponent;
  let fixture: ComponentFixture<AcceptedOrderProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AcceptedOrderProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptedOrderProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
