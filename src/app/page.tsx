import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div
      className="fixed inset-0 ml-64 flex items-center justify-center 
      font-sans overflow-hidden 
      bg-gradient-to-br from-emerald-500 via-teal-500 via-60% to-rose-500"
    >
      <main className="flex flex-col items-center gap-8 sm:gap-12">
        {/* Centered images with button between */}
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <Image
            src="/pizza.png"
            alt="Pizza"
            width={280}
            height={280}
            className="opacity-45 select-none"
            priority
          />

          <Link
            href="/dashboard"
            className="shrink-0 rounded-full px-4 py-2 text-sm sm:text-base font-medium text-black bg-[#009999] hover:bg-[#008080] transition-colors shadow"
          >
            Go to Dashboard
          </Link>

          <Image
            src="/grill.png"
            alt="Grill"
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
