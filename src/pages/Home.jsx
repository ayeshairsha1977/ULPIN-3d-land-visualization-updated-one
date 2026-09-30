import React from "react";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import Capabilities from "@/components/home/Capabilities";
import DemoProperties from "@/components/home/DemoProperties";
import WhyThreeD from "@/components/home/WhyThreeD";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Capabilities />
      <DemoProperties />
      <WhyThreeD />
    </>
  );
}