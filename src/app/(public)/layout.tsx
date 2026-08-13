import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} flex min-h-full flex-col bg-blush`}>
      {children}
    </div>
  );
}
