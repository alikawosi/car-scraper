import React from 'react';
import { Heart, Gauge, Calendar, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CARS = [
  {
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1000&auto=format&fit=crop",
    title: "Mercedes-AMG GT",
    price: "£145,000",
    specs: { year: "2023", mileage: "2.5k", fuel: "Petrol" },
    tag: "Just Listed",
    color: "bg-slate-900"
  },
  {
    image: "https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=1000&auto=format&fit=crop",
    title: "Porsche 911 Turbo S",
    price: "£189,900",
    specs: { year: "2024", mileage: "500", fuel: "Petrol" },
    tag: "Premium",
    color: "bg-gray-800"
  },
  {
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop",
    title: "Chevrolet Corvette",
    price: "£95,500",
    specs: { year: "2023", mileage: "4.2k", fuel: "Petrol" },
    tag: "Hot Deal",
    color: "bg-blue-900"
  }
];

export const HeroCarCards = () => {
  return (
    <div className="relative w-full h-[500px] flex items-center justify-center perspective-[1000px]">
      {/* Decorative glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-motovotive-red/20 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Cards Container */}
      <div className="relative w-full max-w-[500px] h-[400px]">
        {CARS.map((car, index) => (
          <div
            key={index}
            className={`
              absolute left-0 right-0 mx-auto w-[300px] md:w-[360px] bg-white rounded-3xl shadow-xl overflow-hidden
              transition-all duration-700 ease-out border border-slate-100
              hover:scale-105 hover:shadow-2xl hover:z-50 cursor-pointer
              ${index === 0 ? 'top-0 z-30 animate-card-float-1' : ''}
              ${index === 1 ? 'top-8 -right-8 md:-right-16 z-20 scale-95 opacity-80 blur-[1px] hover:blur-none hover:opacity-100 animate-card-float-2' : ''}
              ${index === 2 ? 'top-16 -left-8 md:-left-16 z-10 scale-90 opacity-60 blur-[2px] hover:blur-none hover:opacity-100 animate-card-float-3' : ''}
            `}
            style={{
              animationDelay: `${index * 1.5}s`
            }}
          >
            {/* Image Area */}
            <div className="relative h-44 overflow-hidden">
              {/* Minimal Tag */}
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  {car.tag}
                </span>
              </div>

              <img 
                src={car.image} 
                alt={car.title}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" 
              />
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
            </div>

            {/* Minimal Content */}
            <div className="p-5 bg-white space-y-2 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{car.title}</h3>
                  <p className="text-slate-400 text-xs font-medium mt-1">{car.specs.year} • {car.specs.mileage} • {car.specs.fuel}</p>
                </div>
                <p className="text-motovotive-red font-bold text-lg">{car.price}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
