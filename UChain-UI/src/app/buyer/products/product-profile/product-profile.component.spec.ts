import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProductProfileComponent } from './product-profile.component';

describe('ProductProfileComponent', () => {
  let component: ProductProfileComponent;
  let fixture: ComponentFixture<ProductProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
