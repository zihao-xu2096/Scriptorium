import { UserProvider } from "@/context/UserContext";
import "@/styles/globals.css";
import { MantineProvider } from "@mantine/core";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return(
    <MantineProvider>
      <UserProvider>
          <Component {...pageProps} />
      </UserProvider>
    </MantineProvider>
);
}
