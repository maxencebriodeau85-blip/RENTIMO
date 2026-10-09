import type { Metadata } from "next";
import "../marche/marche.css";
import "./radar.css";
import { Radar } from "./Radar";

export const metadata: Metadata = {
  title: "Radar des passoires énergétiques en Vendée",
  description:
    "Les DPE F et G établis ces 90 derniers jours en Vendée, code postal par code postal, croisés avec les prix DVF et les loyers de marché : où trouver un bien à rénover rentable.",
};

export default function PageRadar() {
  return <Radar />;
}
