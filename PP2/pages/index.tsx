import Dashboard from "@/components/home/Dashboard";
import localFont from "next/font/local";
import { useContext, useEffect } from "react";
import { UserContext } from "@/context/UserContext";
import { LandingPage } from "@/components/home/Landing";
import { Footer } from "@/components/navigation/Footer";
import { NavBar } from "@/components/navigation/NavBar";
import { useRouter } from "next/router";
import { UserPayload } from "@/new-types";

export default function Home() {
  const { user, loading } = useContext(UserContext);

  return (
    loading ? <h1>Loading...</h1> :
    <>
      <NavBar />
      {user ? <Dashboard /> : <LandingPage />}
      <Footer />
    </>
  );
}