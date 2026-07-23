import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-navy-700">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {children}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-navy-300 hover:text-navy-600"
          >
            <Home size={16} />
            홈
          </button>
        </div>
      </div>
    </div>
  );
}
