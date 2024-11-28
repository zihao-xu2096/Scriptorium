import Dashboard from "@/components/home/Dashboard";
import localFont from "next/font/local";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";
import { LandingPage } from "@/components/home/Landing";
import { RichTextEditor } from "@/components/editor/Editor";
import { Footer } from "@/components/navigation/Footer";
import { NavBar } from "@/components/navigation/NavBar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  const { user } = useContext(UserContext);

  return (
    <>
      <NavBar />
      {user ? <Dashboard /> : <LandingPage />}
      <Footer />
    </>
  );
}