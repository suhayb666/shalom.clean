// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth"); // First page is always login
}
