import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'z-keyboard',
  templateUrl: './z-keyboard.component.html',
  styleUrls: ['./z-keyboard.component.scss']
})
export class ZKeyboardComponent implements OnInit {

  @Input() isInteger: boolean = true;//是否为整数
  @Input() isNegative: boolean = false;//是否为负数
  @Input() entertext: string = "Enter";
  @Input() placeholder: string = "This is placeholder";
  @Output() ngModelChange = new EventEmitter<number | string>();

  layout: string = "number";

  ngOnInit() {
    if (this.isInteger && this.isNegative) this.layout = "negativeNumber";//整数 为负数
    if (!this.isInteger && this.isNegative) this.layout = "negativeDecimals";//小数为负数
    if (this.isInteger && !this.isNegative) this.layout = "number";//整数 不为负数
    if (!this.isInteger && !this.isNegative) this.layout = "decimals";//小数 不为负数
  }

  onChange(value: number | string) {
    this.ngModelChange.emit(value);
  }
}
