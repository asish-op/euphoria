import { Instrument_Serif, Manrope, Geist_Mono } from "next/font/google";
import Backdrop from "@/components/Backdrop";
import Preloader from "@/components/Preloader";
import EventProvider from "@/components/EventProvider";
import "./globals.css";
import "./booking.css";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Euphoria Party — Hyderabad",
  description:
    "Glitter, stars and disco. Euphoria is a teen party in Hyderabad, powered by telugu.social.",
  openGraph: {
    title: "Euphoria Party — Hyderabad",
    description: "Glitter. Stars. Disco. One night that glows.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#0b0616",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Backdrop />
        <Preloader />
        <EventProvider>{children}</EventProvider>
      </body>
    </html>
  );
}
