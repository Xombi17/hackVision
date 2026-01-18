"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./NavbarWrapper"; // The original navbar component

export function ConditionalNavbar() {
    const pathname = usePathname();

    // Hide navbar on exam, onboarding, and results pages
    const isHidden = pathname?.startsWith("/exam") || pathname?.startsWith("/onboarding") || pathname?.startsWith("/results");

    if (isHidden) return null;

    return <Navbar />;
}
