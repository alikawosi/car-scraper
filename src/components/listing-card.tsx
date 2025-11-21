import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ListingModel } from "@/lib/models/Listing";
import { Heart } from "lucide-react";

interface ListingCardProps {
  listing: ListingModel;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {listing.image ? (
          <Image
            src={listing.image}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            No Image
          </div>
        )}
        <button className="absolute right-3 top-3 rounded-full bg-white/80 p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-[#E60012]">
          <Heart className="h-5 w-5" />
        </button>
        
        {listing.sellerType === "private" && (
           <span className="absolute left-3 top-3 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800">
             Private seller
           </span>
        )}

        <span className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
           1/1
        </span>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2">
            <div className="flex items-center gap-2">
                 <span className="text-xs font-bold uppercase text-[#E60012]">{listing.website}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{listing.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5em]">{listing.subtitle}</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
             {listing.valuationSummary && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 rounded-sm">
                    Fair price
                </Badge>
             )}
             <Badge variant="outline" className="rounded-sm font-normal text-slate-600">
                 {listing.formattedMileage}
             </Badge>
             {/* We don't have year easily accessible in top level properties yet, would need parsing */}
        </div>

        <div className="mt-auto">
            <div className="mb-1 flex items-end gap-1">
                <span className="text-xl font-bold text-slate-900">{listing.formattedPrice}</span>
            </div>
            
            {listing.valuationSummary && (
                <div className="mb-3 text-xs text-slate-500">
                   <span className="block">Est: {listing.valuationSummary.fairPrice}</span>
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="truncate max-w-[150px]">{listing.location}</span>
                <span className="flex items-center gap-1">
                    {/* Distance could go here */}
                </span>
            </div>
        </div>
      </div>
      
      <a href={listing.link} target="_blank" rel="noreferrer" className="absolute inset-0 z-10" aria-label={`View ${listing.title}`}></a>
    </div>
  );
}

