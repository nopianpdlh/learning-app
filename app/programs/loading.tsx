import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

export default function Loading() {
  return (
    <>
      <Navbar />

      {/* Hero Skeleton */}
      <section className="pt-24 pb-12 bg-linear-to-br from-primary/10 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-2/3 mx-auto" />
          </div>
        </div>
      </section>

      {/* Filters Skeleton */}
      <section className="py-8 border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-[160px]" />
              <Skeleton className="h-10 w-[140px]" />
              <Skeleton className="h-10 w-[160px]" />
              <Skeleton className="h-10 w-[150px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid Skeleton */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <Skeleton className="h-5 w-40 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg overflow-hidden shadow"
              >
                <Skeleton className="aspect-4/3 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
