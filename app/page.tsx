import type { Metadata } from "next";
import { StorefrontExperience } from "./components/storefront/StorefrontExperience";

export const metadata: Metadata = {
  title: "Custom 3D Printing in the Bay Area",
  description:
    "Personalized prints, practical objects, and custom prototypes made locally in the Bay Area.",
};

export default function Home() {
  return <StorefrontExperience />;
}
