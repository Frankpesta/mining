"use client";

import { useEffect } from "react";
import { initGoogleTranslate } from "@/googleTranslate";

export default function GoogleTranslateBootstrap() {
  useEffect(() => {
    initGoogleTranslate("en");
  }, []);

  return null;
}
