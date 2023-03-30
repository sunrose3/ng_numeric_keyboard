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

import * as Keys from '../utils/keys';
import { coerceBooleanProperty, animate } from '../utils/utils';
import { Layout, LayoutsType } from '../utils/layouts';

const RTel = /^\d*$/;

const KeyboardCenter = (() => {
  let activeInput;

  return {
    register(input: any) {
      this.unregister();
      activeInput = input;
      document.addEventListener('touchend', this.unregister, false);
    },
    unregister(e: any) {
      if (!activeInput) {
        return;
      }
      if (e && (activeInput.ks.inputElement.contains(e.target) || activeInput.ks.keyboardElement.contains(e.target))) {
        return;
      }
      activeInput.closeKeyboard();
      activeInput = null;
      document.removeEventListener('touchend', this.unregister, false);
    }
  };
})();

const Options = {
  type: 'number',
  value: '',
  autofocus: false,
  disabled: false,
  readonly: false,
  maxlength: 255,
  name: '',
  placeholder: '',
  format: '^',
  layout: 'number',
  entertext: 'Enter',
  negative: false
};

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
export class NumericInputComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked, ControlValueAccessor {
  private _autofocus: boolean = Options.autofocus;
  private _disabled: boolean = Options.disabled;
  private _readonly: boolean = Options.readonly;
  private _value: number | string = Options.value;
  private _negative: boolean = Options.negative;

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
      this.set('rawValue', rawValue);
      this.set('cursorPos', cursorPos);
    }
    this._value = value;
  }

  @Input() type: string = Options.type;
  @Input() value: number | string = Options.value;
  @Input() maxlength: number = Options.maxlength;
  @Input() name: string = Options.name;
  @Input() placeholder: string = Options.placeholder;
  @Input() format: string | { (val: string): boolean } = Options.format;
  @Input() layout: string | { key: number | string }[][] = Options.layout;
  @Input() entertext: string = Options.entertext;

  @Output() focus = new EventEmitter();
  @Output() blur = new EventEmitter();
  @Output() enterpress = new EventEmitter();
  @Output() ngModelChange = new EventEmitter<number | string>();

  public kp: any;
  public ks: any;
  _onChange = (_: any) => { };

  constructor(
    private element: ElementRef,
    private appRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) { }

  ngOnInit() {
    const resolvedOptions = {};
    for (const key in Options) {
      resolvedOptions[key] = this[key];
    }
    this.init(resolvedOptions);
  }

  ngOnDestroy() {
    KeyboardCenter.unregister(null);
  }

  ngAfterViewInit() {
    this.onMounted(this.element.nativeElement.querySelector('.numeric-input'));
  }

  ngAfterViewChecked() {
    this.onUpdated();
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

  onFocus(e: any) {
    e.stopPropagation();
    this.openKeyboard();
    const cursorPos = +e.target.dataset.index;
    this.set('cursorPos', isNaN(cursorPos) ? this.ks.rawValue.length : cursorPos);
  }

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

  private init(options) {
    let formatFn = options.format;
    if (typeof formatFn === 'string') {
      formatFn = (
        rformat => val =>
          rformat.test(val)
      )(new RegExp(options.format));
    }

    const value = options.value;
    const rawValue = value.toString().split('');
    const cursorPos = rawValue.length;

    this.kp = options;
    this.ks = {
      formatFn,
      value,
      rawValue,
      cursorPos,
      cursorColor: null,
      cursorActive: false,
      keyboard: null,
      inputElement: null,
      keyboardElement: null
    };
  }

  private set(key, value) {
    this.ks[key] = value;
  }

  onMounted(el) {
    this.set('inputElement', el);
    this.set('cursorColor', this.activeColor);

    if (this.kp.autofocus && !this.kp.readonly && !this.kp.disabled) {
      setTimeout(() => this.openKeyboard(), 500);
    }
  }

  onUpdated() {
    this.moveCursor();
  }

  input(key: any) {
    const { type, maxlength } = this.kp;
    const { rawValue, cursorPos, formatFn } = this.ks;

    let otherPos = 1;
    const input = (inputKey: any) => {
      const isAdd = typeof inputKey !== 'undefined';
      const newRawValue = rawValue.slice();
      if (isAdd) {
        if (inputKey === '00') {
          newRawValue.splice(cursorPos, 0, "0");
          newRawValue.splice(cursorPos, 0, "0");
          otherPos = 2;
        } else if ((this.layout === "decimals" || this.layout === "negativeDecimals") &&//为浮点数
          ((newRawValue.length === 0 && inputKey == "0") ||//长度为0 且输入为"0"
            (newRawValue.length === 1 && newRawValue[0] == "-" && inputKey == "0") ||//长度为1 开头是"-" 且输入的是"0"
            //输入的是"."的时候 (开头是"-" 长度为1) 或者长度为 0
            (inputKey === '.' && ((newRawValue[0] === '-' && newRawValue.length === 1) || (newRawValue.length === 0))))) {
          newRawValue.splice(cursorPos, 0, ".");
          newRawValue.splice(cursorPos, 0, "0");
          otherPos = 2;
        }
        else {
          newRawValue.splice(cursorPos, 0, inputKey);
        }
      } else {
        if ((this.layout === "decimals" || this.layout === "negativeDecimals") && //为浮点数
          (newRawValue.length === 2 && newRawValue[0] == "0") ||//长度是2 第一个开头是0
          (newRawValue.length === 3 && newRawValue[0] == "-" && newRawValue[1] == "0")) { //长度是3 开头是"-" 第二个是"0"
          newRawValue.splice(cursorPos - 2, 2);
          otherPos = 2;
        } else {
          newRawValue.splice(cursorPos - 1, 1);
        }
      }
      let newValue = newRawValue.join('');
      let newValueString = newRawValue.join('');
      if (formatFn(newValue)) {
        if (type === 'number') {
          if (this.layout === 'number' && !/[1-9]\d*|0/.test(newValue) && newValue) {
            return;
          } else if (this.layout === 'negativeNumber' && !/^-?(([1-9]{1}\d*)|0)$/.test(newValue) && newValue && newValue !== '-') {
            return;
          } else if (this.layout === 'decimals' && !/^\d*(?:\.\d*)?$/.test(newValue)) {
            return;
          } else if (this.layout === 'negativeDecimals' && !/^-?\d*(?:\.\d*)?$/.test(newValue)) { return; }
          newValue = parseFloat(newValue);
          if (isNaN(newValue)) {
            newValue = '';
            this._negative = false;
            this.set('cursorPos', 0);
          }
        } else if (newValue.length > maxlength || (type === 'tel' && !RTel.test(newValue))) {
          return;
        }
        //解决一直输出多个0在前面的问题
        let newValueArr = newValueString === "-"||newValueString === "0." || newValueString === "-0." || inputKey ==="." ||newRawValue[newRawValue.length - 1] === "."? newRawValue : newValue.toString().split("");
        if (newValueArr.length !== newRawValue.length && otherPos !== 2) {
          otherPos = otherPos - (newRawValue.length - newValueArr.length);
        }

        this.set('value', newValue);
        // this.set('rawValue', newRawValue);
        this.set('rawValue', newValueArr);
        this.set('cursorPos', isAdd ? cursorPos + otherPos : cursorPos - otherPos);
        this.dispatch('input', newValue);
      }
    };

    switch (key) {
      case Keys.NEGATIVE:
        this.changeNegative(rawValue.slice(), cursorPos);
        break;
      case Keys.BLANK:
        break;
      case Keys.ESC:
        this.closeKeyboard();
        break;
      case Keys.ENTER:
        this.closeKeyboard();
        this.dispatch('enterpress');
        break;
      case Keys.DEL:
        if (cursorPos > 0) {
          input(undefined);
        }
        break;
      case Keys.DOT:
      case Keys.ZERO:
      case Keys.ONE:
      case Keys.TWO:
      case Keys.THREE:
      case Keys.FOUR:
      case Keys.FIVE:
      case Keys.SIX:
      case Keys.SEVEN:
      case Keys.EIGHT:
      case Keys.NINE:
      case Keys.DOUBLEZERO:
      default:
        input(key);
        break;
    }
  }

  //正负数
  changeNegative(newRawValue, cursorPos) {
    this._negative = !this._negative; ''
    //false 是正数 true是负数
    if (this._negative) {
      newRawValue.splice(0, 0, "-");
    } else {
      newRawValue.splice(0, 1);
    }

    let newValue = newRawValue.join('');
    this.set('value', newValue);
    this.set('rawValue', newRawValue);
    this.set('cursorPos', this._negative ? cursorPos + 1 : cursorPos - 1);
    this.dispatch('input', newValue);
  }

  moveCursor() {
    if (!this.ks.cursorActive) {
      return;
    }

    const elCursor = this.ks.inputElement.querySelector('.numeric-input-cursor');
    const elText = this.ks.inputElement.querySelector('.numeric-input-text');
    const elCharactor = elText.querySelector(`span:nth-child(${this.ks.cursorPos})`);

    if (!elCharactor) {
      elCursor.style.transform = 'translateX(0)';
      elText.style.transform = 'translateX(0)';
      return;
    }

    const cursorOffset = elCharactor.offsetLeft + elCharactor.offsetWidth;
    const maxVisibleWidth = elText.parentNode.offsetWidth;
    elCursor.style.transform = `translateX(${Math.min(maxVisibleWidth - 1, cursorOffset)}px)`;
    elText.style.transform = `translateX(${Math.min(0, maxVisibleWidth - cursorOffset)}px)`;
  }

  openKeyboard() {
    if (this.ks.keyboard) {
      return;
    }

    const elContainer = document.createElement('div');
    const elShadow = document.createElement('div');
    const elKeyboard = document.createElement('div');
    elContainer.className = 'numeric-keyboard-actionsheet';
    elContainer.appendChild(elShadow);
    elContainer.appendChild(elKeyboard);
    document.body.appendChild(elContainer);

    this.createKeyboard(
      elKeyboard,
      {
        layout: this.kp.layout || this.kp.type,
        entertext: this.kp.entertext
      },
      {
        press: this.input.bind(this)
      },
      keyboard => this.set('keyboard', keyboard)
    );

    animate(
      (timestamp, frame, frames) => {
        elKeyboard.style.position = 'fixed';
        elKeyboard.style.bottom = '0';
        elKeyboard.style.left = '0';
        elKeyboard.style.transform = `translateY(${((frames - frame) / frames) * 100}%)`;
      },
      () => { },
      10
    );

    this.set('keyboardElement', elKeyboard);
    this.set('cursorActive', true);
    this.set('cursorPos', this.ks.rawValue.length);

    this.isFocus = true;
    this.dispatch('focus');
    KeyboardCenter.register(this);
  }

  closeKeyboard() {
    if (!this.ks.keyboard) {
      return;
    }

    const keyboard = this.ks.keyboard;
    const elKeyboard = this.ks.keyboardElement;

    animate(
      (timestamp, frame, frames) => {
        elKeyboard.style.transform = `translateY(${(frame / frames) * 100}%)`;
      },
      () => {
        setTimeout(() => {
          this.destroyKeyboard(elKeyboard, keyboard);
          document.body.removeChild(elKeyboard.parentNode);
        }, 50);
      },
      10
    );

    this.set('keyboard', null);
    this.set('keyboardElement', null);
    this.set('cursorActive', false);
    this.set('cursorPos', 0);

    this.isFocus = false;
    this.dispatch('blur');
    KeyboardCenter.unregister(null);
  }
}

export interface InputOptions {
  layout: keyof LayoutsType | Layout;
  entertext: string;
}
