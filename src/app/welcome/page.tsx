// src/app/welcome/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function Welcome() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center font-sans overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 60%, #f43f5e 100%)'
      }}
>
      <main className="flex flex-col items-center gap-8 sm:gap-12">
        {/* Centered images with button between */}
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <Image
            src="/pizza.png"
            alt="Shalom Logo Left"
            width={280}
            height={280}
            className="opacity-45 select-none"
            priority
          />

          <Link
            href="/dashboard"
            className="shrink-0 rounded-full px-6 py-3 text-lg font-semibold text-white bg-[#009999] hover:bg-[#008080] transition-colors shadow-lg"
          >
            Go to Dashboard
          </Link>

          <Image
            src="/grill.png"
            alt="Shalom Logo Right"
            width={280}
            height={280}
            className="opacity-45 select-none"
            priority
          />
        </div>
      </main>
    </div>
  );
}
