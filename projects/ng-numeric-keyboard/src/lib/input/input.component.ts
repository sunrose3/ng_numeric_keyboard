import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  AfterViewInit,
  AfterViewChecked,
  ElementRef,
  ApplicationRef,
  EmbeddedViewRef,
  forwardRef,
  Injector,
  ComponentFactoryResolver
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

import { NumericKeyboardComponent } from '../keyboard/keyboard.component';
import { coerceBooleanProperty } from '../utils/utils';
import { Layout, LayoutsType } from '../utils/layouts';
import { Options, Parent } from '../utils/input';
@Component({
  selector: 'ng-numeric-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumericInputComponent),
      multi: true
    }
  ]
})
export class NumericInputComponent extends Parent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked, ControlValueAccessor {
  private _autofocus: boolean = Options.autofocus;
  private _disabled: boolean = Options.disabled;
  private _readonly: boolean = Options.readonly;
  private _value: number | string = Options.value;

  @Input() activeColor = '#3B3B3B';
  public isFocus = false;

  @Input()
  get autofocus() {
    return this._autofocus;
  }
  set autofocus(value: any) {
    this._autofocus = coerceBooleanProperty(value);
  }

  @Input()
  get disabled() {
    return this._disabled;
  }
  set disabled(value: any) {
    this._disabled = coerceBooleanProperty(value);
  }

  @Input()
  get readonly() {
    return this._readonly;
  }
  set readonly(value: any) {
    this._readonly = coerceBooleanProperty(value);
  }

  @Input()
  get ngModel() {
    return this._value;
  }
  set ngModel(value: any) {
    if (this.ks && this.ks.value !== value) {
      const rawValue = value.toString().split('');
      const cursorPos = rawValue.length;
      // this.Mixins.set.call(this,'rawValue', rawValue);
      // this.Mixins.set.call(this,'cursorPos', cursorPos);
    }
    this._value = value;
  }

  @Input() type: string = Options.type;
  @Input() value: number | string = Options.value;
  @Input() maxlength: number = Options.maxlength;
  @Input() name: string = Options.name;
  @Input() placeholder: string = Options.placeholder;
  @Input() format: string | { (val: string): boolean } = Options.format;
  @Input() layout: string | { key: number | string }[][] =  Options.layout;
  @Input() entertext: string = Options.entertext;

  @Output() focus = new EventEmitter();
  @Output() blur = new EventEmitter();
  @Output() enterpress = new EventEmitter();
  @Output() ngModelChange = new EventEmitter<number | string>();

  _onChange = (_: any) => { };

  constructor(
    private element: ElementRef,
    private appRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) { 
    super();
  }

  ngOnInit() {
    const resolvedOptions = {};
    for (const key in Options) {
      resolvedOptions[key] = this[key];
    }
    this.init.call(this,resolvedOptions);
  }

  ngOnDestroy() {
    this.destroy.call(this)
  }

  ngAfterViewInit() {
    this.onMounted.call(this, this.element.nativeElement.querySelector('.numeric-input'))
  }

  ngAfterViewChecked() {
    this.onUpdated.call(this)
  }

  trackByIndex(index) {
    return index;
  }

  writeValue(value: any): void {
    if (typeof value === undefined || value === null) {
      this._value = '';
    } else {
      this._value = value;
    }
  }

  registerOnChange(fn: (_: any) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void { }


  dispatch(event: string, payload?: number | string) {
    switch (event) {
      case 'focus':
        this.focus.emit();
        break;
      case 'blur':
        this.blur.emit();
        break;
      case 'enterpress':
        this.enterpress.emit();
        break;
      case 'input':
        this.ngModelChange.emit(payload);
        break;
    }
  }

  createKeyboard(el, options, events, callback) {
    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory(NumericKeyboardComponent)
      .create(this.injector);

    Object.assign(componentRef.instance, options);

    componentRef.instance.ngOnInit();

    for (const event in events) {
      componentRef.instance[event].subscribe(events[event]);
    }

    this.appRef.attachView(componentRef.hostView);
    const element = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
    el.appendChild(element);

    callback(componentRef);
  }

  destroyKeyboard(el, keyboard) {
    keyboard.destroy();
    this.appRef.detachView(keyboard.hostView);
  }
}

export interface InputOptions {
  layout: keyof LayoutsType | Layout;
  entertext: string;
}
