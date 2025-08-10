"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(function(err) {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);

  return null; // This component doesn't render anything
}