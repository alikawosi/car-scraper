"use client";


import Image from "next/image";
import { FormEvent, useMemo, useState, useEffect } from "react";
import { HeroCarCards } from "@/components/landing/HeroCarCards";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { signout } from "@/app/auth/actions";
import {
  SlidersHorizontal,
  Heart,
  User,
  Menu,
  Search,
} from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SearchCriteria, Website, SearchOptions } from "@/lib/types";
import { SearchService } from "@/lib/services/search-service";
import {
  PRICE_OPTIONS,
  RADIUS_OPTIONS,
  SORT_OPTIONS,
  YEAR_OPTIONS,
  MILEAGE_OPTIONS,
} from "@/lib/constants";

const DEFAULT_CRITERIA: SearchCriteria = {
  postcode: "EC1A 1BB",
  limit: 12,
  radius: 25,
  sort: "most-recent",
  sellerType: "private",
  sources: ["autotrader", "ebay", "gumtree"],
};

const SOURCE_OPTIONS: { label: string; value: Website }[] = [
  { label: "AutoTrader", value: "autotrader" },
  { label: "eBay", value: "ebay" },
  { label: "Gumtree", value: "gumtree" },
];

export default function HomePage() {
  const router = useRouter();
  const [criteria, setCriteria] = useState<SearchCriteria>({
    ...DEFAULT_CRITERIA,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const options = await SearchService.getInstance().getSearchOptions();
        setSearchOptions(options);
      } catch (error) {
        console.error("Failed to fetch search options:", error);
      }
    };
    fetchOptions();
  }, []);

  const modelOptions = useMemo(() => {
    if (!searchOptions?.models) return [];
    if (!criteria.make) return [];
    
    const selectedMakeOption = searchOptions.makes.find(m => m.value === criteria.make);
    if (!selectedMakeOption?.id) return [];

    return searchOptions.models.filter(model => model.make_id === selectedMakeOption.id);
  }, [criteria.make, searchOptions]);

  const handleInput =
    (field: keyof SearchCriteria) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setCriteria((prev) => ({
        ...prev,
        [field]: value.trim() === "" ? undefined : value,
      }));
    };

  const handleMakeChange = (value: string) => {
    setCriteria((prev) => ({
      ...prev,
      make: value === "any" ? undefined : value,
      model: undefined,
    }));
  };

  const handleSelectNumber =
    (
      field: keyof SearchCriteria,
      options?: {
        allowFloat?: boolean;
      }
    ) =>
    (value: string) => {
      if (value === "any") {
        setCriteria((prev) => ({ ...prev, [field]: undefined }));
        return;
      }
      const parsed = options?.allowFloat
        ? parseFloat(value)
        : parseInt(value, 10);
      setCriteria((prev) => ({
        ...prev,
        [field]: Number.isNaN(parsed) ? undefined : parsed,
      }));
    };

  const handleSelectString =
    (field: keyof SearchCriteria) => (value: string) => {
      setCriteria((prev) => ({
        ...prev,
        [field]: value === "any" ? undefined : value,
      }));
    };

  const handleTransmissionChange = (value: string) => {
    setCriteria((prev) => ({
      ...prev,
      transmissions: value === "any" ? undefined : [value],
    }));
  };

  const toggleSource = (source: Website) => {
    setCriteria((prev) => {
      const current = prev.sources ?? [];
      if (current.includes(source)) {
        return { ...prev, sources: current.filter((s) => s !== source) };
      }
      return { ...prev, sources: [...current, source] };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!criteria.postcode) {
      // Optionally show an error toast here
      alert("Please provide a postcode before searching.");
      return;
    }

    const queryString = encodeURIComponent(JSON.stringify(criteria));
    router.push(`/search?criteria=${queryString}`);
  };

  const handleReset = () => {
    setCriteria({ ...DEFAULT_CRITERIA });
    setShowAdvanced(false);
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 pb-12 font-sans selection:bg-motovotive-red selection:text-white">
      {/* Header */}
      <nav 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-md border-slate-200/50 h-20 shadow-sm" 
            : "bg-transparent border-transparent h-24"
        }`}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link
              href="/"
              className="flex items-center gap-3 group"
            >
              <Logo size={40} className="text-motovotive-red transition-transform duration-300 group-hover:scale-110" />
              <span className={`text-2xl font-black italic tracking-tighter ${isScrolled ? "text-slate-900" : "text-slate-900"} transition-colors`}>
                MOTOVOTIVE
              </span>
            </Link>
            <div className={`hidden md:flex items-center gap-8 text-sm font-semibold transition-colors ${isScrolled ? "text-muted-foreground" : "text-slate-600"}`}>
              <a href="#" className="hover:text-motovotive-red transition-colors">
                Search
              </a>
              <a href="#" className="hover:text-motovotive-red transition-colors">
                Sell
              </a>
              <a href="#" className="hover:text-motovotive-red transition-colors">
                Valuation
              </a>
              <a href="#" className="hover:text-motovotive-red transition-colors">
                Reviews
              </a>
            </div>
          </div>
          <div className={`flex items-center gap-6 text-sm font-medium transition-colors ${isScrolled ? "text-muted-foreground" : "text-slate-600"}`}>
            <div className="flex flex-col items-center gap-1 hover:text-motovotive-red cursor-pointer transition-colors group">
              <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 hover:text-motovotive-red cursor-pointer transition-colors"
              >
                <div className="flex flex-col items-center gap-1 group">
                  <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-motovotive-red hover:bg-red-600 text-white font-bold rounded-full px-6 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Log in
                </Button>
              </Link>
            )}
            <div className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden min-h-[600px] flex items-center bg-gradient-to-b from-slate-50 via-white to-slate-50"
        onMouseMove={(e) => {
          const { left, top } = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - left;
          const y = e.clientY - top;
          e.currentTarget.style.setProperty("--x", `${x}px`);
          e.currentTarget.style.setProperty("--y", `${y}px`);
        }}
      >
        
        {/* Mouse Glow Effect */}
        <div 
          className="pointer-events-none absolute inset-0 transition duration-300"
          style={{
            background: `radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(240, 60, 46, 0.05), transparent 40%)`,
          }}
        />

        {/* Interactive Grid Background */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#F03C2E_1px,transparent_1px),linear-gradient(to_bottom,#F03C2E_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 [mask-image:radial-gradient(300px_circle_at_var(--x,_50%)_var(--y,_50%),black,transparent)] transition-opacity duration-300" 
        />
        {/* Static Faint Grid for Context */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />

        {/* Velocity Lines Animation - Primary Color */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden [mask-image:radial-gradient(500px_circle_at_var(--x,_50%)_var(--y,_50%),black,transparent)]"
        >
          <div className="absolute top-[20%] left-0 w-full h-[1px] bg-motovotive-red/30 animate-velocity-line" style={{ animationDuration: '3s' }} />
          <div className="absolute top-[40%] left-0 w-full h-[1px] bg-motovotive-red/20 animate-velocity-line" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-[60%] left-0 w-full h-[1px] bg-motovotive-red/25 animate-velocity-line" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          <div className="absolute top-[80%] left-0 w-full h-[1px] bg-motovotive-red/15 animate-velocity-line" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-24 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="space-y-8 max-w-2xl flex-1 animate-slide-in-up">
            <div className="inline-flex items-center bg-motovotive-red bg-opacity-20 gap-2 rounded-full pl-2 pr-4 py-1.5 border border-motovotive-red hover:border-motovotive-red/20 transition-colors cursor-default">
              <div className="w-2 h-2 bg-motovotive-red rounded-full" />
              <span className="text-sm font-medium tracking-wide text-motovotive-black">AI-Powered </span>
            </div>
            
            <div className="space-y-4 relative">
              {/* Watermark Logo */}

              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none text-slate-900 relative z-10">
                MOTION YOU <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-motovotive-red to-motovotive-orange">
                  CAN TRUST.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 font-medium max-w-lg leading-relaxed relative z-10">
                Made for Motion. Built with Motivation.
                <span className="block text-sm mt-3 text-slate-500 font-normal">Algorithm-driven insights for the modern automotive enthusiast.</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button 
                onClick={() => document.getElementById('search-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-motovotive-red hover:bg-red-600 text-white border-2 border-transparent h-14 px-8 text-lg font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                Start Your Search
              </Button>
              <Button 
                variant="outline" 
                className="border-slate-200 bg-white text-slate-700 hover:text-motovotive-red hover:bg-slate-50 hover:border-slate-300 h-14 px-8 text-lg font-medium rounded-full transition-all"
              >
                How it Works
              </Button>
            </div>
          </div>

          {/* Hero Visual - Animated Cards */}
          <div className="hidden lg:block flex-1 h-[500px] relative animate-fade-in w-full">
             <HeroCarCards />
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section id="search-form" className="container mx-auto px-4 -mt-24 relative z-20 mb-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-2 border border-white/50">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 md:p-8 rounded-[1.6rem] shadow-sm border border-slate-100/50"
          >
            <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-end">
              {/* Postcode */}
              <div className="w-full lg:flex-1 space-y-2.5">
                <Label
                  htmlFor="postcode"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1"
                >
                  Postcode
                </Label>
                <div className="relative group">
                  <Input
                    id="postcode"
                    placeholder="e.g. EC1A 1BB"
                    value={criteria.postcode ?? ""}
                    onChange={handleInput("postcode")}
                    required
                    className="h-14 rounded-xl border-slate-200 pl-11 bg-slate-50/50 focus:bg-white transition-all text-base font-medium shadow-sm group-hover:border-slate-300"
                  />
                  <div className="absolute left-3.5 top-4 text-slate-400 group-focus-within:text-motovotive-red transition-colors">
                    <Search className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Make */}
              <div className="w-full lg:flex-1 space-y-2.5">
                <Label
                  htmlFor="make"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1"
                >
                  Make
                </Label>
                <Select
                  value={criteria.make ?? undefined}
                  onValueChange={handleMakeChange}
                >
                  <SelectTrigger
                    id="make"
                    className="h-14 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-base font-medium shadow-sm"
                  >
                    <SelectValue placeholder="Any make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any make</SelectItem>
                    {searchOptions?.makes.map((make) => (
                      <SelectItem key={make.value} value={make.value}>
                        {make.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model */}
              <div className="w-full lg:flex-1 space-y-2.5">
                <Label
                  htmlFor="model"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1"
                >
                  Model
                </Label>
                <Select
                  value={criteria.model ?? undefined}
                  onValueChange={(val) =>
                    setCriteria((prev) => ({
                      ...prev,
                      model: val === "any" ? undefined : val,
                    }))
                  }
                  disabled={!criteria.make}
                >
                  <SelectTrigger
                    id="model"
                    className="h-14 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-base font-medium shadow-sm disabled:opacity-50 disabled:bg-slate-100"
                  >
                    <SelectValue
                      placeholder={
                        criteria.make ? "Any model" : "Select make first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any model</SelectItem>
                    {modelOptions.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="w-full lg:w-auto">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full lg:w-auto h-14 rounded-xl bg-velocity-gradient hover:bg-none hover:bg-motovotive-red text-white px-10 font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="mr-2">Search Cars</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-motovotive-red hover:text-motovotive-red hover:bg-red-50/50 px-3 py-2 h-auto rounded-lg font-semibold text-sm transition-all"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {showAdvanced ? "Hide advanced filters" : "Show advanced filters"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground px-3 py-2 h-auto text-sm font-medium"
              >
                Reset all
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 animate-accordion-down overflow-hidden">
                {/* Sources */}
                <div className="space-y-3 lg:col-span-4 mb-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sources</Label>
                  <div className="flex gap-3 flex-wrap">
                    {SOURCE_OPTIONS.map((source) => {
                      const isSelected =
                        !criteria.sources ||
                        criteria.sources.length === 0 ||
                        criteria.sources.includes(source.value);
                      return (
                        <div
                          key={source.value}
                          onClick={() => toggleSource(source.value)}
                          className={`
                            cursor-pointer px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border select-none
                            ${isSelected 
                              ? 'bg-motovotive-red text-white border-motovotive-red shadow-md transform scale-105' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }
                          `}
                        >
                          {source.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="bodyType" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Body type</Label>
                  <Select
                    value={criteria.bodyType ?? undefined}
                    onValueChange={handleSelectString("bodyType")}
                  >
                    <SelectTrigger id="bodyType" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {searchOptions?.bodyTypes.map((body) => (
                        <SelectItem key={body.value} value={body.value}>
                          {body.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="radius" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Radius</Label>
                  <Select
                    value={
                      criteria.radius !== undefined
                        ? String(criteria.radius)
                        : undefined
                    }
                    onValueChange={handleSelectNumber("radius")}
                  >
                    <SelectTrigger id="radius" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {RADIUS_OPTIONS.map((radius) => (
                        <SelectItem key={radius} value={String(radius)}>
                          {radius} miles
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="minYear" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Min year</Label>
                  <Select
                    value={
                      criteria.minYear ? String(criteria.minYear) : undefined
                    }
                    onValueChange={handleSelectNumber("minYear")}
                  >
                    <SelectTrigger id="minYear" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {YEAR_OPTIONS.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="maxYear" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Max year</Label>
                  <Select
                    value={
                      criteria.maxYear ? String(criteria.maxYear) : undefined
                    }
                    onValueChange={handleSelectNumber("maxYear")}
                  >
                    <SelectTrigger id="maxYear" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {YEAR_OPTIONS.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="priceFrom" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Price from (£)</Label>
                  <Select
                    value={
                      criteria.minPrice ? String(criteria.minPrice) : undefined
                    }
                    onValueChange={handleSelectNumber("minPrice")}
                  >
                    <SelectTrigger id="priceFrom" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {PRICE_OPTIONS.map((price) => (
                        <SelectItem key={price} value={String(price)}>
                          £{price.toLocaleString("en-GB")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="priceTo" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Price to (£)</Label>
                  <Select
                    value={
                      criteria.maxPrice ? String(criteria.maxPrice) : undefined
                    }
                    onValueChange={handleSelectNumber("maxPrice")}
                  >
                    <SelectTrigger id="priceTo" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {PRICE_OPTIONS.map((price) => (
                        <SelectItem key={price} value={String(price)}>
                          £{price.toLocaleString("en-GB")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="mileageFrom" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Mileage from</Label>
                  <Select
                    value={
                      criteria.minMileage
                        ? String(criteria.minMileage)
                        : undefined
                    }
                    onValueChange={handleSelectNumber("minMileage")}
                  >
                    <SelectTrigger id="mileageFrom" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {MILEAGE_OPTIONS.map((mileage) => (
                        <SelectItem key={mileage} value={String(mileage)}>
                          {mileage.toLocaleString("en-GB")} miles
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="mileageTo" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Mileage to</Label>
                  <Select
                    value={
                      criteria.maxMileage
                        ? String(criteria.maxMileage)
                        : undefined
                    }
                    onValueChange={handleSelectNumber("maxMileage")}
                  >
                    <SelectTrigger id="mileageTo" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {MILEAGE_OPTIONS.map((mileage) => (
                        <SelectItem key={mileage} value={String(mileage)}>
                          {mileage.toLocaleString("en-GB")} miles
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="fuelType" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Fuel type</Label>
                  <Select
                    value={criteria.fuelType ?? undefined}
                    onValueChange={handleSelectString("fuelType")}
                  >
                    <SelectTrigger id="fuelType" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {searchOptions?.fuelTypes.map((fuel) => (
                        <SelectItem key={fuel.value} value={fuel.value}>
                          {fuel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="transmission" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Transmission</Label>
                  <Select
                    value={
                      criteria.transmissions?.[0]
                        ? criteria.transmissions[0]
                        : undefined
                    }
                    onValueChange={handleTransmissionChange}
                  >
                    <SelectTrigger id="transmission" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {searchOptions?.transmissionTypes.map((transmission) => (
                        <SelectItem key={transmission.value} value={transmission.value}>
                          {transmission.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="sellerType" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Seller</Label>
                  <Select
                    value={criteria.sellerType ?? undefined}
                    onValueChange={handleSelectString("sellerType")}
                  >
                    <SelectTrigger id="sellerType" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="trade">Dealer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="doors" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Doors</Label>
                  <Select
                    value={criteria.doors ? String(criteria.doors) : undefined}
                    onValueChange={handleSelectNumber("doors")}
                  >
                    <SelectTrigger id="doors" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {searchOptions?.doors
                        .filter((door) => door.value !== "any")
                        .map((door) => (
                        <SelectItem key={door.value} value={String(door.value)}>
                          {door.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="seats" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Seats</Label>
                  <Select
                    value={criteria.seats ? String(criteria.seats) : undefined}
                    onValueChange={handleSelectNumber("seats")}
                  >
                    <SelectTrigger id="seats" className="h-11 rounded-xl">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {searchOptions?.seats
                        .filter((seat) => seat.value !== "any")
                        .map((seat) => (
                        <SelectItem key={seat.value} value={String(seat.value)}>
                          {seat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="sort" className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Sort by</Label>
                  <Select
                    value={criteria.sort ?? undefined}
                    onValueChange={handleSelectString("sort")}
                  >
                    <SelectTrigger id="sort" className="h-11 rounded-xl">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
