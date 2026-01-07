type GoogleTranslateNamespace = {
  translate?: {
    TranslateElement?: {
      new (options: { pageLanguage?: string; autoDisplay?: boolean; layout?: unknown }, elementId: string): void;
      InlineLayout?: {
        SIMPLE?: unknown;
      };
    };
  };
};

declare global {
  interface Window {
    __googleTranslateBootstrapped?: boolean;
    __googleTranslateInitialized?: boolean;
    googleTranslateElementInit?: () => void;
    google?: GoogleTranslateNamespace;
  }
}

export function initGoogleTranslate(pageLanguage = "en") {
  if (typeof window === "undefined") return;

  // Prevent double execution (Strict Mode safe)
  if (window.__googleTranslateBootstrapped) return;
  window.__googleTranslateBootstrapped = true;

  const WRAPPER_ID = "google-translate-wrapper";
  const TARGET_ID = "google_translate_element";

  // Create DOM container ONCE
  if (!document.getElementById(WRAPPER_ID)) {
    const wrapper = document.createElement("div");
    wrapper.id = WRAPPER_ID;
    wrapper.style.position = "fixed";
    wrapper.style.bottom = "16px";
    wrapper.style.right = "16px";
    wrapper.style.zIndex = "9999";

    const target = document.createElement("div");
    target.id = TARGET_ID;

    wrapper.appendChild(target);
    document.body.appendChild(wrapper);
  }

  // Google callback
  window.googleTranslateElementInit = () => {
    if (window.__googleTranslateInitialized) return;

    const TranslateElement = window.google?.translate?.TranslateElement;

    if (!TranslateElement) return;

    window.__googleTranslateInitialized = true;

    new TranslateElement(
      {
        pageLanguage,
        autoDisplay: false,
      },
      TARGET_ID,
    );
  };

  // Inject script ONCE
  if (!document.querySelector('script[src*="translate.google.com"]')) {
    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.head.appendChild(script);
  }
}
