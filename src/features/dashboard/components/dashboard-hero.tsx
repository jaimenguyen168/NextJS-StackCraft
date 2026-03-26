import React from "react";
import { TopographyBackground } from "@/components/ui/topography";
const DashboardHero = () => {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      <TopographyBackground
        lineCount={20}
        lineColor="rgba(100, 100, 100, 0.15)"
        backgroundColor="transparent"
        speed={0.5}
        strokeWidth={0.1}
        yOffset={250}
        className="h-full"
      />
    </div>
  );
};

export default DashboardHero;
