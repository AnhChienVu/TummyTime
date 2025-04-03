import "@/styles/globals.css";
import "bootstrap/dist/css/bootstrap.css";
import Layout from "@/components/Layout/Layout";
import { appWithTranslation } from "next-i18next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function App({ Component, pageProps }) {
  const router = useRouter();
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
      if (router.pathname !== "/login") {
        router.push("/login?message=Session expired. Please log in again.");
      }
    } else {
      setIsCheckingToken(false);
    }
  }, [router]);

  if (isCheckingToken && router.pathname !== "/login") {
    return null;
  }

  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return getLayout(<Component {...pageProps} />);
}

export default appWithTranslation(App);

// Helper function to check if the token is expired
const isTokenExpired = (token) => {
  try {
    const { exp } = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);

    return exp < currentTime;
  } catch (error) {
    console.log("Error decoding token:", error);
    return true; // Assume expired if there's an error
  }
};
