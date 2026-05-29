import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-9xl font-black text-white/20 mb-4 select-none">404</div>
        <div className="flex justify-center mb-4">
          <AlertCircle size={64} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-white/80 mb-8">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition"
        >
          <Home size={18} /> Back to Home
        </Link>
      </div>
    </div>
  );
}