import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  link = 'https://github.com/sunrose3/ng_numeric_keyboard';
  title = 'ng-numeric-keyboard-demo';

  onChange(string: string){
    console.log(string);
  }
}
