import "@/styles/globals.css";
import "bootstrap/dist/css/bootstrap.css";
import Layout from "@/components/Layout/Layout";
import { appWithTranslation } from "next-i18next";

function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return getLayout(<Component {...pageProps} />);
}

export default appWithTranslation(App);
