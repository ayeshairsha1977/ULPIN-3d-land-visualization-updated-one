import React from "react";
import { PROPERTIES } from "@/data/properties";
import PropertyCard from "@/components/home/PropertyCard";
import DemoTag from "@/components/common/DemoTag";

export default function DemoProperties() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">Demo properties</p>
          <h2 className="text-2xl md:text-3xl font-bold text-ink">Three buildings in Maisammaguda, three kinds of vertical property</h2>
        </div>
        <DemoTag>Demo boundaries &amp; layouts</DemoTag>
      </div>
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        {PROPERTIES.map((p) => <PropertyCard key={p.id} property={p} />)}
      </div>
    </section>
  );
}