"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 pt-8 pb-6 text-sm text-gray-600">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Left side */}
        <div className="text-center sm:text-left">
          <span className="font-semibold text-gray-800">CareerCompass</span> © {new Date().getFullYear()} — All rights reserved.
        </div>

        {/* Right side */}
        <div className="flex flex-wrap justify-center sm:justify-end gap-4 text-gray-600">
          <a
            href="/privacy"
            className="hover:text-[var(--lav-400)] transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/contact"
            className="hover:text-[var(--lav-400)] transition-colors"
          >
            Contact Us
          </a>
          <a
            href="mailto:support@careercompass.io"
            className="hover:text-[var(--lav-400)] transition-colors"
          >
            Support
          </a>
          <a
            href="https://forms.gle/feature-request-form"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--lav-400)] transition-colors"
          >
            Feature / Bug Request
          </a>
        </div>
      </div>
    </footer>
  );
}