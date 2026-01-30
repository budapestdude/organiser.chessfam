import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-white/10 rounded ${className}`} />
);

export const AvatarSkeleton = () => (
  <div className="flex flex-col items-center gap-2">
    <Skeleton className="w-20 h-20 rounded-full" />
    <Skeleton className="w-16 h-4" />
    <Skeleton className="w-12 h-3" />
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white/5 rounded-xl p-4">
    <Skeleton className="w-full h-32 rounded-xl mb-3" />
    <Skeleton className="w-3/4 h-5 mb-2" />
    <Skeleton className="w-1/2 h-4 mb-2" />
    <Skeleton className="w-1/4 h-6" />
  </div>
);

export const ListSkeleton = () => (
  <div className="bg-white/5 rounded-xl p-4">
    <div className="flex gap-4">
      <Skeleton className="w-32 h-32 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="w-1/4 h-5 mb-2" />
        <Skeleton className="w-3/4 h-6 mb-3" />
        <Skeleton className="w-1/2 h-4" />
      </div>
    </div>
  </div>
);

export const HomeSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="min-h-screen py-8 px-4 md:px-8 lg:px-12 max-w-4xl mx-auto"
  >
    {/* Header */}
    <div className="text-center mb-8">
      <Skeleton className="w-48 h-10 mx-auto mb-2" />
      <Skeleton className="w-32 h-4 mx-auto mb-4" />
      <Skeleton className="w-64 h-12 mx-auto rounded-xl" />
    </div>

    {/* Sections */}
    {[1, 2, 3, 4].map((section) => (
      <div key={section} className="mb-8">
        <div className="flex justify-between mb-4">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-20 h-5" />
        </div>
        <div className="flex justify-center gap-6 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <AvatarSkeleton key={item} />
          ))}
        </div>
      </div>
    ))}
  </motion.div>
);

export default Skeleton;
