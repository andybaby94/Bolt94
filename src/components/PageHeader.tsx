import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export function PageHeader({
  title,
  showBack = true,
  showHome = true,
  rightSlot,
}: {
  title: string;
  showBack?: boolean;
  showHome?: boolean;
  rightSlot?: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-lg font-bold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {rightSlot}
        {showHome && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
          >
            <Home size={14} />
            홈
          </button>
        )}
      </div>
    </div>
  );
}
