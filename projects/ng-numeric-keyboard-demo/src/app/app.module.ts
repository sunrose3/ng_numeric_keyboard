import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { ZKeyboardModule } from '../z-keyboard/z-keyboard.module';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ZKeyboardModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
