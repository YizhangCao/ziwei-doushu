import type { Config } from "tailwindcss";

// 设计系统（#57）：颜色、阴影、圆角、字重、动效全部指向 app/globals.css 里的 token，
// 组件里现有的 Tailwind 类（rounded-xl、font-bold、ring-2……）不用改就能跟着换风格。

/**
 * 封闭色板：Tailwind 自带的彩色色系一律映射到五个语义 token，所有深浅档位都是同一个颜色，
 * 透明度修饰（如 border-red-500/30）照常生效。这样组件里不论写了哪个彩色类，
 * 屏幕上都只会出现这五种颜色。
 */
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const toToken = (token: string) =>
  Object.fromEntries(SHADES.map((shade) => [shade, `color-mix(in srgb, var(${token}) calc(<alpha-value> * 100%), transparent)`]));

const SEMANTIC_COLORS = {
  // 金：命宫、当前大限、上格等最主要的命盘含义
  amber: toToken("--ac"),
  purple: toToken("--ac"),
  violet: toToken("--ac"),
  indigo: toToken("--ac"),
  fuchsia: toToken("--ac"),
  // 绿：禄、吉
  emerald: toToken("--lu"),
  green: toToken("--lu"),
  lime: toToken("--lu"),
  // 蓝：权、提示（身宫、吉星）
  blue: toToken("--quan"),
  sky: toToken("--quan"),
  cyan: toToken("--quan"),
  teal: toToken("--quan"),
  // 赭：科、注意
  yellow: toToken("--ke"),
  orange: toToken("--ke"),
  // 红：忌、不利、错误
  red: toToken("--ji"),
  rose: toToken("--ji"),
  pink: toToken("--ji"),
};

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // 直角：所有圆角都是 2px；full 只留给真正的圆（头像、圆点、开关滑块）
    borderRadius: {
      none: "0px",
      xs: "var(--r-xs)",
      sm: "var(--r-sm)",
      DEFAULT: "var(--r-sm)",
      md: "var(--r-md)",
      lg: "var(--r-lg)",
      xl: "var(--r-xl)",
      "2xl": "var(--r-xl)",
      "3xl": "var(--r-xl)",
      pill: "var(--r-pill)",
      full: "9999px",
    },
    // 字重：最重到 600（苹方 Semibold）。层级靠字号和透明度，不靠加粗
    fontWeight: {
      thin: "300",
      extralight: "300",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "600",
      extrabold: "600",
      black: "600",
    },
    extend: {
      colors: {
        ...SEMANTIC_COLORS,
        bg: {
          0: "var(--bg-0)",
          1: "var(--bg-1)",
          2: "var(--bg-2)",
          inv: "var(--bg-inv)",
        },
        tx: {
          0: "var(--tx-0)",
          1: "var(--tx-1)",
          2: "var(--tx-2)",
          3: "var(--tx-3)",
          inv: "var(--tx-inv)",
        },
        ac: {
          DEFAULT: "var(--ac)",
          dim: "var(--ac-dim)",
        },
        // 四化语义色
        lu: "var(--lu)",
        quan: "var(--quan)",
        ke: "var(--ke)",
        ji: "var(--ji)",
      },
      // 键盘焦点环：金色，和 :focus-visible 的描边一致
      ringColor: {
        DEFAULT: "var(--ac)",
      },
      ringOffsetColor: {
        DEFAULT: "var(--bg-0)",
      },
      fontFamily: {
        sans: ["var(--font)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        xs: "var(--sh-xs)",
        sm: "var(--sh-sm)",
        md: "var(--sh-md)",
        lg: "var(--sh-lg)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.15, 1, 0.35, 1)",
        calm: "cubic-bezier(0.15, 1, 0.35, 1)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      animation: {
        "fade-up": "fadeUp 600ms cubic-bezier(0.15, 1, 0.35, 1) both",
        "fade-in": "fadeIn 600ms cubic-bezier(0.15, 1, 0.35, 1) both",
        "spin-slow": "spin 20s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
