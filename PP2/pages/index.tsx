import Dashboard from "@/components/home/Dashboard";
import { LandingPage } from "@/components/home/Landing";
import { Footer } from "@/components/navigation/Footer";
import { NavBar } from "@/components/navigation/NavBar";
import withAuth from "@/components/withAuth";
import { UserContext } from "@/context/UserContext";
import { useContext } from "react";

function Home() {
  const { user } = useContext(UserContext);

  return (
    <>
      <NavBar />
      {user ? <Dashboard /> : <LandingPage />}
      <Footer />
    </>
  );
}

export default withAuth(Home);