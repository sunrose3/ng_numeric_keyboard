import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZKeyboardComponent } from './z-keyboard.component';
import { NgNumericKeyboardModule } from 'zen-numeric-keyboard';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    NgNumericKeyboardModule, 
    FormsModule
  ],
  declarations: [ZKeyboardComponent],
  exports:[ZKeyboardComponent]
})
export class ZKeyboardModule { }
