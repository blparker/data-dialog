import FullScreenMessage from '@/components/full-screen-message';
import { Aperture } from 'lucide-react';

export default function Home() {
    return (
        <FullScreenMessage className="text-primary">
            <h1 className="text-4xl font-bold flex items-center gap-2">
                <Aperture className="w-10 h-10" />
                DataDialog
            </h1>
        </FullScreenMessage>
    );
}
