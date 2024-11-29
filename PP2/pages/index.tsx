
import Dashboard from "@/components/home/Dashboard";
import { LandingPage } from "@/components/home/Landing";
import { Footer } from "@/components/navigation/Footer";
import { NavBar } from "@/components/navigation/NavBar";
import { UserContext } from "@/context/UserContext";
import { useContext } from "react";

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