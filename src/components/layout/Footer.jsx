import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="no-print border-t border-line bg-card mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-4 md:items-center md:justify-between text-sm text-muted-foreground">
        <div>
          <p className="font-heading font-bold text-ink">ULPIN 3D</p>
          <p>3D ULPIN Property Mapping & Digital Twin Platform · Smart India Hackathon prototype</p>
        </div>
        <nav className="flex gap-5">
          <Link to="/map" className="hover:text-ink">Map</Link>
          <Link to="/ulpin" className="hover:text-ink">ULPIN</Link>
          <Link to="/about" className="hover:text-ink">About</Link>
        </nav>
      </div>
    </footer>
  );
}