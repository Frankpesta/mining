"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";

export function WhatsAppFloat() {
  const [isHovered, setIsHovered] = useState(false);
  const phoneNumber = "447836228446"; // +44 7836228446 without + and spaces
  const message = "Hello! I have a question about your services.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-all duration-300 hover:bg-[#20BA5A] hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Chat on WhatsApp"
    >
      {/* WhatsApp Icon */}
      <div className="relative flex h-12 w-12 items-center justify-center">
        <svg
          viewBox="0 0 32 32"
          fill="currentColor"
          className="h-8 w-8"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M16 0c-8.837 0-16 7.163-16 16 0 2.825 0.737 5.607 2.137 8.048l-2.137 7.952 8.138-2.125c2.322 1.288 4.956 1.968 7.862 1.968 8.837 0 16-7.163 16-16s-7.163-16-16-16zM16 29.332c-2.547 0-5.052-0.712-7.256-2.056l-0.52-0.312-5.412 1.412 1.444-5.364-0.344-0.544c-1.488-2.368-2.276-5.1-2.276-7.9 0-8.197 6.67-14.867 14.867-14.867s14.867 6.67 14.867 14.867c0 8.197-6.67 14.867-14.867 14.867z" />
          <path d="M23.456 19.524c-0.368-0.184-2.18-1.076-2.52-1.2-0.34-0.124-0.588-0.184-0.836 0.184s-0.96 1.2-1.176 1.448c-0.216 0.248-0.432 0.28-0.8 0.096-0.368-0.184-1.556-0.572-2.964-1.828-1.096-0.976-1.836-2.18-2.052-2.548s-0.024-0.568 0.16-0.752c0.168-0.164 0.368-0.432 0.552-0.648 0.184-0.216 0.248-0.368 0.372-0.616s0.064-0.464-0.028-0.648c-0.092-0.184-0.836-2.016-1.148-2.756-0.3-0.724-0.608-0.624-0.836-0.636-0.216-0.012-0.464-0.012-0.712-0.012s-0.648 0.092-0.988 0.464c-0.34 0.372-1.296 1.268-1.296 3.092s1.328 3.584 1.512 3.832c0.184 0.248 2.596 3.968 6.292 5.564 0.88 0.38 1.568 0.608 2.104 0.78 0.884 0.28 1.688 0.24 2.324 0.144 0.708-0.104 2.18-0.892 2.488-1.752 0.308-0.86 0.308-1.6 0.216-1.752s-0.34-0.248-0.708-0.432z" />
        </svg>
      </div>

      {/* Text Label - appears on hover */}
      <span
        className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ${
          isHovered ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        Chat with us
      </span>

      {/* Pulse animation ring */}
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" />
    </a>
  );
}

