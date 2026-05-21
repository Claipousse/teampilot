import { redirect } from "next/navigation";

//On redirige vers page loggin dès le début, pour accéder au site, faut être connecté, pas de connexion invité possible
export default function Home() {
  redirect("/login");
}