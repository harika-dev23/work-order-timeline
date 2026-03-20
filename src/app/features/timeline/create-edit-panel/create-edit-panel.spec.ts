import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEditPanel } from './create-edit-panel';

describe('CreateEditPanel', () => {
  let component: CreateEditPanel;
  let fixture: ComponentFixture<CreateEditPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEditPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEditPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
