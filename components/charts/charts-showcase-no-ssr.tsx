"use client";

import dynamic from "next/dynamic";

const ChartsShowcase = dynamic(
  () => import("@/components/charts/charts-showcase").then((mod) => mod.ChartsShowcase),
  {
    ssr: false,
  }
);

export function ChartsShowcaseNoSSR() {
  return <ChartsShowcase />;
}
