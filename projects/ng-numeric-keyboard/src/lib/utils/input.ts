import * as Keys from './keys'
import { animate } from './utils';
const RTel = /^\d*$/;

export const KeyboardCenter = (() => {
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

export const Options = {
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

export class Parent {
    private _negative: boolean = Options.negative;//正负"-/+"使用的
    layout: string | { key: number | string }[][] = Options.layout;
    public isFocus = false;
    public kp: any;
    public ks: any;
    activeColor = '#3B3B3B';

    init(options) {
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
    destroy() {
        KeyboardCenter.unregister(null)
    }
    set(key, value) {
        this.ks[key] = value;
    }

    onMounted(el: any) {
        this.set('inputElement', el);
        this.set('cursorColor', this.activeColor);
        if (this.kp.autofocus && !this.kp.readonly && !this.kp.disabled) {
            setTimeout(() => this.openKeyboard(), 500);
        }
    }

    onUpdated() {
        this.moveCursor();
    }

    onFocus(e: any) {
        e.stopPropagation();
        this.openKeyboard();
        const cursorPos = +e.target.dataset.index;
        this.set('cursorPos', isNaN(cursorPos) ? this.ks.rawValue.length : cursorPos);
    }

    input(key: any) {
        const { rawValue, cursorPos } = this.ks;
        const ZERO_INDEX = 0;
        const MINUS_SIGN = "-";
        const DOT_SIGN = ".";
        const DIGIT_LENGTH = 1;
        const DOUBLE_DIGIT_LENGTH = 2;

        const addDigit = (digit: string, insertPos: number) => {
            const newRawValue = [...rawValue];
            if (digit === Keys.DOUBLEZERO) {
                newRawValue.splice(insertPos, 0, "0", "0");
                otherPos = DOUBLE_DIGIT_LENGTH;
            } else if (
                digit === Keys.DOT &&
                ((newRawValue[ZERO_INDEX] === MINUS_SIGN && newRawValue.length === 1) ||
                    newRawValue.length === 0)
            ) {
                newRawValue.splice(insertPos, 0, "0", DOT_SIGN);
                otherPos = DOUBLE_DIGIT_LENGTH;
            } else {
                newRawValue.splice(insertPos, 0, digit);
            }
            this.verification(newRawValue, digit, otherPos);
        };

        const removeDigit = (deletePos: number) => {
            const newRawValue = [...rawValue];
            newRawValue.splice(deletePos - DIGIT_LENGTH, DIGIT_LENGTH);
            if (
                newRawValue[ZERO_INDEX] === DOT_SIGN ||
                newRawValue.join("").indexOf(MINUS_SIGN + DOT_SIGN) !== -1
            ) {
                newRawValue.splice(deletePos - DIGIT_LENGTH, DIGIT_LENGTH);
            }
            this.verification(newRawValue, undefined, otherPos);
        };

        let otherPos = DIGIT_LENGTH;

        switch (key) {
            case Keys.NEGATIVE:
                this.changeNegative([...rawValue], cursorPos);
                break;
            case Keys.BLANK:
                break;
            case Keys.ESC:
                this.closeKeyboard();
                break;
            case Keys.ENTER:
                this.closeKeyboard();
                this.dispatch("enterpress");
                break;
            case Keys.DEL:
                if (cursorPos > ZERO_INDEX) {
                    removeDigit(cursorPos);
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
                addDigit(key, cursorPos);
                break;
        }
    }

    //输入内容校验
    verification(newRawValue, inputKey, otherPos) {
        const { type, maxlength } = this.kp;
        const { cursorPos, formatFn } = this.ks;
        const isAdd = typeof inputKey !== 'undefined';
        let newValue = newRawValue.join('');
        let newValueArr = newRawValue;

        if (formatFn(newValue)) {
            if (type === 'number') {
                //正则表达式 解决粘贴出现奇怪的东西 (别用变量写正则 正则有缓存)
                if (!/^-?\d*(?:\.\d*)?$/.test(newValue)) return;
                newValue = parseFloat(newValue);
                newValueArr = newValue.toString().split("");
                if (isNaN(newValue)) {
                    newValue = '';
                    this._negative = false;//空的时候默认为正数
                }
                const newValueString = newRawValue.join('');//下面有用的
                newValueArr = newValueString === "-" || newValueString === "-0"//保留'-'
                    || inputKey === "." || newRawValue[newRawValue.length - 1] === "."//输入为'.' 或者 删除'.'后所有内容('xxx.')
                    || (newValueString.indexOf("0.") != -1 && newValueString.substring(0, 2) === "0.") || (newValueString.indexOf("-0.") != -1) //'0.'或'-0.'
                    ? newRawValue : newValue.toString().split("");
                    
                if (newValue == 0 && (inputKey === "0" || inputKey === "00")) {//值为0 时候 输入多个0
                    if (inputKey === "00") otherPos = cursorPos == this._negative ? 1 : 0;//如果有"0"输入值,这个数值不占位
                    if (newValueString.indexOf(".") != -1) {//浮点数
                        if (cursorPos < newValueString.indexOf('.'))
                            newRawValue.splice(cursorPos, 1);
                        newValueArr = newRawValue;
                    } else {//整数
                        newValueArr = this._negative ? ["-", "0"] : ['0'];
                    }
                }

                //计算占位值 1.输入值与显示值不同时 2.当显示值为0时,输入"00"
                if (newValueArr.length !== newRawValue.length && !(inputKey == "00" && newValue == 0)) otherPos = otherPos - (newRawValue.length - newValueArr.length);

            } else if (newValue.length > maxlength || (type === 'tel' && !RTel.test(newValue))) {//电话
                return;
            }
            this.writeSetValue(newValue, newValueArr, isAdd ? cursorPos + otherPos : cursorPos - otherPos);
        }
    }

    //正负数
    changeNegative(newRawValue, cursorPos) {
        this._negative = !this._negative;
        //false 是正数 true是负数
        if (this._negative) {
            newRawValue.splice(0, 0, "-");
        } else {
            newRawValue.splice(0, 1);
        }
        this.writeSetValue(newRawValue.join(''), newRawValue, this._negative ? cursorPos + 1 : cursorPos - 1);
    }

    //写入内容
    writeSetValue(newValue, newRawValue, cursorPos) {
        this.set('value', newValue);
        this.set('rawValue', newRawValue);
        this.set('cursorPos', cursorPos);
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

    createKeyboard(el, options, events, callback) {
        throw new Error('createKeyboard method must be overrided!')
    }

    destroyKeyboard(el, keyboard) {
        throw new Error('destroyKeyboard method must be overrided!')
    }
    dispatch(event: string, payload?: number | string) {
        throw new Error('dispatch method must be overrided!')
    }
}