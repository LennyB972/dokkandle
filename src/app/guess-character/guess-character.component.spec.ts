import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuessCharacterComponent } from './guess-character.component';

describe('GuessCharacterComponent', () => {
  let component: GuessCharacterComponent;
  let fixture: ComponentFixture<GuessCharacterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuessCharacterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuessCharacterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
