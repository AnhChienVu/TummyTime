import "@/styles/globals.css";
import "bootstrap/dist/css/bootstrap.css";
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return getLayout(<Component {...pageProps} />);
}
