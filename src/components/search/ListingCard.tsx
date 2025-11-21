import Image from "next/image";
import { Heart, MapPin, Loader2, ScanEye } from "lucide-react";
import { ListingViewModel } from "@/view-models/ListingViewModel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  viewModel: ListingViewModel;
  className?: string;
}

export function ListingCard({ viewModel, className }: ListingCardProps) {
  const rating = viewModel.priceRating;
  const isAnalyzing = viewModel.isAnalyzing;

  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all overflow-hidden h-full relative",
        className
      )}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {viewModel.imageUrl ? (
          <Image
            src={viewModel.imageUrl}
            alt={viewModel.title}
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              isAnalyzing ? "opacity-80" : "group-hover:scale-105"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50">
            <span className="text-xs font-medium">No Image</span>
          </div>
        )}

        {/* Analyzing Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
            <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1.5 font-medium backdrop-blur-md border border-white/20 animate-pulse">
              <ScanEye className="w-3 h-3" />
              <span>SCANNING PLATE</span>
            </div>
          </div>
        )}

        {/* Seller Badge */}
        {viewModel.sellerType && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded text-slate-700 shadow-sm border border-white/50">
              {viewModel.sellerType}
            </span>
          </div>
        )}

        {/* Heart Button */}
        <button className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-slate-400 hover:text-red-500 transition-colors shadow-sm">
          <Heart className="w-4 h-4" />
        </button>

        {/* Image Count (Mock) */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-[2px] text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
          1/1
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {viewModel.website}
            </span>
          </div>
          <h3 className="font-bold text-lg text-slate-900 line-clamp-1 leading-tight">
            {viewModel.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
            {viewModel.subtitle}
          </p>
        </div>

        {/* Specs Tags */}
        <div className="flex flex-wrap gap-2 min-h-[24px]">
          {isAnalyzing ? (
            <div className="flex items-center gap-2 w-full">
              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#E60012] w-2/3 animate-[shimmer_1s_infinite]" />
              </div>
              <span className="text-[10px] font-medium text-slate-400 animate-pulse">
                Valuating...
              </span>
            </div>
          ) : (
            <>
              {rating && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "rounded-md text-[10px] font-bold uppercase tracking-wide border-0",
                    rating.type === "great"
                      ? "bg-emerald-100 text-emerald-800"
                      : rating.type === "good"
                      ? "bg-green-100 text-green-800"
                      : rating.type === "fair"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-orange-100 text-orange-800"
                  )}
                >
                  {rating.label}
                </Badge>
              )}
              {viewModel.mileage && (
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[11px] font-bold border border-slate-200">
                  {viewModel.mileage}
                </span>
              )}
            </>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto pt-3 border-t border-slate-50 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-slate-900 leading-none">
              {viewModel.price}
            </span>
            <span className="text-xs text-slate-400 mt-1 h-4 block">
              {isAnalyzing ? (
                <span className="animate-pulse">Checking market...</span>
              ) : (
                <span>Fair: £{viewModel.plate ? "Checked" : "Unknown"}</span>
              )}
            </span>
          </div>

          {viewModel.location && (
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[80px]">
                {viewModel.location}
              </span>
            </div>
          )}
        </div>

        <a
          href={viewModel.link}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-center w-full py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-[#E60012] hover:text-white transition-colors"
        >
          View Details
        </a>
      </div>
    </div>
  );
}
