"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Heart, User, Menu, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { SearchCriteria, Listing } from "@/lib/types";
import { SearchService } from "@/lib/services/search-service";
import { ListingCard } from "@/components/search/ListingCard";
import { FilterBar } from "@/components/search/FilterBar";
import { Button } from "@/components/ui/button";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCriteria, setCurrentCriteria] = useState<SearchCriteria>({});

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      setListings([]);

      try {
        const criteriaParam = searchParams.get("criteria");
        if (!criteriaParam) {
          setLoading(false);
          return;
        }

        const criteria = JSON.parse(
          decodeURIComponent(criteriaParam)
        ) as SearchCriteria;
        
        // Ensure page is at least 1
        if (!criteria.page || criteria.page < 1) {
            criteria.page = 1;
        }

        setCurrentCriteria(criteria);

        const searchService = SearchService.getInstance();
        await searchService.search(criteria, (updatedListings) => {
          setListings(updatedListings);
          if (updatedListings.length > 0) {
            setLoading(false);
          }
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [searchParams]);

  const handleApplyFilters = (newCriteria: SearchCriteria) => {
      // Reset to page 1 when filters change
      const criteriaWithPage = { ...newCriteria, page: 1 };
      const queryString = encodeURIComponent(JSON.stringify(criteriaWithPage));
      router.push(`/search?criteria=${queryString}`);
  };

  const handlePageChange = (newPage: number) => {
      const newCriteria = { ...currentCriteria, page: newPage };
      const queryString = encodeURIComponent(JSON.stringify(newCriteria));
      router.push(`/search?criteria=${queryString}`);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && listings.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#E60012]" />
        <p className="mt-4 text-slate-500 font-medium">
          Scraping marketplaces...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Something went wrong
        </h2>
        <p className="text-slate-500 mt-2">{error}</p>
      </div>
    );
  }

  const handleRecommendedSearch = (make: string, model: string) => {
    const newCriteria: SearchCriteria = {
      make,
      model,
      page: 1,
      sort: "most-recent"
    };
    const queryString = encodeURIComponent(JSON.stringify(newCriteria));
    router.push(`/search?criteria=${queryString}`);
  };

  if (!loading && listings.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-slate-100 p-6 rounded-full mb-6">
          <Search className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          No results found
        </h2>
        <p className="text-slate-500 mb-8 max-w-md">
          We couldn&apos;t find any cars matching your criteria. Try adjusting your filters or check out these popular searches:
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => handleRecommendedSearch("BMW", "3 Series")}
            className="hover:border-[#E60012] hover:text-[#E60012]"
          >
            BMW 3 Series
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleRecommendedSearch("Audi", "A3")}
            className="hover:border-[#E60012] hover:text-[#E60012]"
          >
            Audi A3
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleRecommendedSearch("Mercedes-Benz", "C Class")}
            className="hover:border-[#E60012] hover:text-[#E60012]"
          >
            Mercedes-Benz C Class
          </Button>
        </div>
      </div>
    );
  }

  const currentPage = currentCriteria.page || 1;

  return (
    <div className="space-y-6">
      <FilterBar 
        currentCriteria={currentCriteria} 
        onApplyFilters={handleApplyFilters} 
      />

      <div className="flex items-center justify-between">
        {/* Removed Result Count */}
        <div /> 
        <span className="text-sm text-slate-500">Sorted by Relevance</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing.listingId} listing={listing} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 pt-8 pb-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <span className="text-sm font-medium text-slate-600">
              Page {currentPage}
          </span>

          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={loading || listings.length === 0} // Disable next if no results (or maybe we reached end)
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-2xl font-bold text-[#E60012] tracking-tighter"
            >
              AutoTrader
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-[#E60012]">
                Home
              </Link>
              <span className="text-slate-900 font-semibold">Used cars</span>
              <Link href="#" className="hover:text-[#E60012]">
                New cars
              </Link>
              <Link href="#" className="hover:text-[#E60012]">
                Sell
              </Link>
              <Link href="#" className="hover:text-[#E60012]">
                Valuation
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <div className="flex flex-col items-center gap-1 hover:text-[#E60012] cursor-pointer transition-colors">
              <Heart className="w-5 h-5" />
              <span className="text-[10px]">Saved</span>
            </div>
            <div className="flex flex-col items-center gap-1 hover:text-[#E60012] cursor-pointer transition-colors">
              <User className="w-5 h-5" />
              <span className="text-[10px]">Sign In</span>
            </div>
            <div className="md:hidden">
              <Menu className="w-6 h-6" />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <SearchContent />
        </Suspense>
      </main>
    </div>
  );
}
