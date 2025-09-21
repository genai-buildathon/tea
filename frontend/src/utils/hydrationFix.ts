/**
 * ハイドレーションエラーを修正するためのユーティリティ
 * ブラウザ拡張機能による属性変更を検知・対処
 */

/**
 * ブラウザ拡張機能によって追加される可能性のある属性のリスト
 */
const EXTENSION_ATTRIBUTES = [
  "cz-shortcut-listen", // ClickUp
  "data-new-gr-c-s-check-loaded", // Grammarly
  "data-gr-ext-installed", // Grammarly
  "spellcheck", // Various extensions
  "data-ms-editor", // Microsoft Editor
  "data-lt-installed", // LanguageTool
];

/**
 * ブラウザ拡張機能による属性を除去する
 * ハイドレーション前に実行してSSRとの不一致を防ぐ
 */
export const removeExtensionAttributes = () => {
  if (typeof window === "undefined") return;

  // body要素から拡張機能の属性を除去
  const body = document.body;
  if (body) {
    EXTENSION_ATTRIBUTES.forEach((attr) => {
      if (body.hasAttribute(attr)) {
        body.removeAttribute(attr);
      }
    });
  }

  // html要素からも除去
  const html = document.documentElement;
  if (html) {
    EXTENSION_ATTRIBUTES.forEach((attr) => {
      if (html.hasAttribute(attr)) {
        html.removeAttribute(attr);
      }
    });
  }
};

/**
 * ハイドレーション後に拡張機能の属性を復元する
 * 拡張機能の機能を維持するため
 */
export const restoreExtensionAttributes = () => {
  if (typeof window === "undefined") return;

  // 少し遅延させて拡張機能が属性を追加するのを待つ
  setTimeout(() => {
    // 必要に応じて特定の属性を復元
    // 通常は拡張機能が自動的に再追加するので何もしない
  }, 100);
};

/**
 * ハイドレーション修正を実行する
 */
export const fixHydration = () => {
  if (typeof window === "undefined") return;

  // DOM読み込み前に実行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removeExtensionAttributes);
  } else {
    removeExtensionAttributes();
  }

  // ハイドレーション後に復元
  window.addEventListener("load", restoreExtensionAttributes);
};
