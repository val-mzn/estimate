import { Skeleton } from './ui/skeleton';

export default function LoadingState() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4 w-full max-w-md px-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-8 w-1/2 mx-auto" />
            </div>
        </div>
    );
}

