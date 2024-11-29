
import Dashboard from "@/components/home/Dashboard";
import localFont from "next/font/local";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";
import { LandingPage } from "@/components/home/Landing";
import { RichTextEditor } from "@/components/editor/Editor";
import { Footer } from "@/components/navigation/Footer";
import { NavBar } from "@/components/navigation/NavBar";
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SearchIndex() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/login');
  }, [router]);

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