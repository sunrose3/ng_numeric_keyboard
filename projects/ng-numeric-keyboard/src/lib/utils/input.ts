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

        let otherPos = 1;//1.解决"00"按钮需要填充2个"0"进行占位 2.解决小数时候 第一个按"."的时候自动匹配0
        const input = (inputKey: any) => {
            const isAdd = typeof inputKey !== 'undefined';
            const newRawValue = rawValue.slice();
            if (isAdd) {
                if (inputKey === '00') {
                    newRawValue.splice(cursorPos, 0, "0");
                    newRawValue.splice(cursorPos, 0, "0");
                    otherPos = 2;
                } else if ((this.layout === "decimals" || this.layout === "negativeDecimals") &&//为浮点数
                    //输入的是"."的时候 (开头是"-" 长度为1) 或者长度为 0
                    ((inputKey === '.' && ((newRawValue[0] === '-' && newRawValue.length === 1) || (newRawValue.length === 0))))) {
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
            this.verification(newRawValue, inputKey, otherPos, isAdd);
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

    //输入内容校验
    verification(newRawValue, inputKey, otherPos, isAdd) {
        const { type, maxlength } = this.kp;
        const { cursorPos, formatFn } = this.ks;
        let newValue = newRawValue.join('');
        let newValueString = newRawValue.join('');//下面有用的
        if (formatFn(newValue)) {
            if (type === 'number') {
                //正则表达式 解决粘贴出现奇怪的东西 (别用变量写正则 正则有缓存)
                if (this.layout === 'number' && !/[1-9]\d*|0/.test(newValue) && newValue) return;
                if (this.layout === 'negativeNumber' && !/^-?(([1-9]\d*)|0)/.test(newValue) && newValue && newValue !== '-') return;
                if (this.layout === 'decimals' && !/^\d*(?:\.\d*)?$/.test(newValue)) return;
                if (this.layout === 'negativeDecimals' && !/^-?\d*(?:\.\d*)?$/.test(newValue)) return;
                newValue = parseFloat(newValue);
                if (isNaN(newValue)) {
                    newValue = '';
                    this._negative = false;//空的时候默认为正数
                    this.set('cursorPos', 0);//加了可能有用 大脑短路了 
                }
            } else if (newValue.length > maxlength || (type === 'tel' && !RTel.test(newValue))) {
                return;
            }

            //解决一直输出多个0在前面的输入问题 一言难尽啊!不是语言能说明白的
            //特殊几个情况以外保留输入的数组,剩下的获取当前值的数组.newValue.toString().split("")
            //但是!!0.00之类的是获取到的是0会影响用户体验,所以要保留之前输入内容数组的
            //解决的是0.00点后面的内容不让输入的问题.
            let newValueArr = newValueString === "-" || (newValueString.indexOf("0.") != -1 && newValueString.substring(0, 2) === "0.") || newValueString === "-0" || (newValueString.indexOf("-0.") != -1) ||
                inputKey === "." || newRawValue[newRawValue.length - 1] === "." ? newRawValue : newValue.toString().split("");
            //-0的问题,toString()会认为是0
            //分别解决的错误为 0000.00显示为0 
            // -00.00 显示为0
            //-0.000 显示为0 
            // debugger
            if (newValue === 0 && (inputKey === "0" || inputKey === "00")) {//当值为0时候 你还在那咔咔输入0,你想咋滴
                if (this._negative && cursorPos < 3) {//为负数的时候,"-0." 之间加值
                    if (newValueString.indexOf(".") != -1) {//如果是浮点数时候
                        newRawValue.splice(cursorPos, 1);//我不会让你得逞,把你输入的内容移除
                        newValueArr = newRawValue;
                    } else {
                        if (inputKey === "00") otherPos = cursorPos == 1 ? 1 : 0;//如果有"0"输入值,这个数值不占位
                        newValueArr = ["-", "0"];//整数的时候或者整数的部分,只能保存成"-0"
                    }
                } else if (!this._negative && cursorPos < 2) {//输入的位置为前俩,也就是"0."或者"0"之间添加
                    if (newValueString.indexOf(".") != -1) {//如果值包括"0."的时候,还在"."输入0,我会把输入值直接干掉!!!
                        newRawValue.splice(cursorPos, 1);
                        newValueArr = newRawValue;
                    } else {
                        if (inputKey === "00") otherPos = cursorPos == 0 ? 1 : 0;//如果有"0"输入值,这个数值不占位
                        newValueArr = ['0'];//整数开始! 输入多少个0 它还是0
                    }
                }
            }
            //计算一下 如果值数组和输入内容数组插值 获取到应该改变位置大小
            if (newValueArr.length !== newRawValue.length && otherPos !== 2 && inputKey !== "00") {
                otherPos = otherPos - (newRawValue.length - newValueArr.length);
            }
            this.set('value', newValue);
            this.set('rawValue', newValueArr);
            this.set('cursorPos', isAdd ? cursorPos + otherPos : cursorPos - otherPos);
            this.dispatch('input', newValue);
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