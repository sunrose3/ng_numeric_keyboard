import * as Keys from './keys';

//电话模式
const PhoneLayout: Layout = [
  [{ key: Keys.ONE }, { key: Keys.TWO }, { key: Keys.THREE }, { key: Keys.DEL }],
  [{ key: Keys.FOUR }, { key: Keys.FIVE }, { key: Keys.SIX }, { key: Keys.ENTER }],
  [{ key: Keys.SEVEN }, { key: Keys.EIGHT }, { key: Keys.NINE }, { key: Keys.DOT }],
  [{ key: Keys.BLANK }, { key: Keys.ZERO }, { key: Keys.BLANK }, { key: Keys.ESC }]
];

//正整数
const NumberLayout: Layout = [
  [{ key: Keys.ONE }, { key: Keys.TWO }, { key: Keys.THREE }, { key: Keys.DEL, rowspan: 2 }],
  [{ key: Keys.FOUR }, { key: Keys.FIVE }, { key: Keys.SIX }],
  [{ key: Keys.SEVEN }, { key: Keys.EIGHT }, { key: Keys.NINE }, { key: Keys.ENTER, rowspan: 2 }],
  [{ key: Keys.DOUBLEZERO }, { key: Keys.ZERO }, { key: Keys.BLANK }]
];

//正小数
const DecimalsLayout: Layout = [
  [{ key: Keys.ONE }, { key: Keys.TWO }, { key: Keys.THREE }, { key: Keys.DEL, rowspan: 2 }],
  [{ key: Keys.FOUR }, { key: Keys.FIVE }, { key: Keys.SIX }],
  [{ key: Keys.SEVEN }, { key: Keys.EIGHT }, { key: Keys.NINE }, { key: Keys.ENTER, rowspan: 2 }],
  [{ key: Keys.BLANK }, { key: Keys.ZERO }, { key: Keys.DOT }]
];

//正负整数
const NegativeDecimalsLayout: Layout = [
  [{ key: Keys.ONE }, { key: Keys.TWO }, { key: Keys.THREE }, { key: Keys.DEL, rowspan: 2 }],
  [{ key: Keys.FOUR }, { key: Keys.FIVE }, { key: Keys.SIX }],
  [{ key: Keys.SEVEN }, { key: Keys.EIGHT }, { key: Keys.NINE }, { key: Keys.ENTER, rowspan: 2 }],
  [{ key: Keys.NEGATIVE }, { key: Keys.ZERO }, { key: Keys.DOT }]
];

//正负小数
const NegativeNumberLayout: Layout = [
  [{ key: Keys.ONE }, { key: Keys.TWO }, { key: Keys.THREE }, { key: Keys.DEL, rowspan: 2 }],
  [{ key: Keys.FOUR }, { key: Keys.FIVE }, { key: Keys.SIX }],
  [{ key: Keys.SEVEN }, { key: Keys.EIGHT }, { key: Keys.NINE }, { key: Keys.ENTER, rowspan: 2 }],
  [{ key: Keys.NEGATIVE }, { key: Keys.ZERO }, { key: Keys.DOUBLEZERO }]
];
export const Layouts: LayoutsType = {
  number: NumberLayout,
  phone: PhoneLayout,
  decimals: DecimalsLayout,
  negativeNumber:NegativeNumberLayout,
  negativeDecimals:NegativeDecimalsLayout
};

export interface LayoutItem {
  key: string;
  rowspan?: number;
  colspan?: number;
}

export type Layout = LayoutItem[][];

export interface LayoutsType {
  number: Layout;
  phone: Layout;
  decimals: Layout;
  negativeNumber: Layout;
  negativeDecimals:Layout;
}
