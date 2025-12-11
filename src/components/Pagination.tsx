import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (currentPage > halfMaxPages + 1 && totalPages > maxPagesToShow) {
        pageNumbers.push('...');
      }

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= halfMaxPages) {
          startPage = 2;
          endPage = maxPagesToShow - 1;
      } else if (currentPage >= totalPages - halfMaxPages) {
          startPage = totalPages - maxPagesToShow + 2;
          endPage = totalPages - 1;
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (currentPage < totalPages - halfMaxPages && totalPages > maxPagesToShow) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
      <div className="text-sm text-neutral-600">
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
      </div>
      <nav>
        <ul className="flex items-center -space-x-px h-8 text-sm">
          <li>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-neutral-500 bg-white border border-e-0 border-neutral-300 rounded-s-lg hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
          </li>
          {pageNumbers.map((page, index) => (
            <li key={index}>
              {typeof page === 'number' ? (
                <button
                  onClick={() => onPageChange(page)}
                  className={`flex items-center justify-center px-3 h-8 leading-tight border border-neutral-300 ${
                    currentPage === page
                      ? 'text-primary bg-primary/10 border-primary font-bold'
                      : 'text-neutral-500 bg-white hover:bg-neutral-100 hover:text-neutral-700'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span className="flex items-center justify-center px-3 h-8 leading-tight text-neutral-500 bg-white border border-neutral-300">
                  {page}
                </span>
              )}
            </li>
          ))}
          <li>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center px-3 h-8 leading-tight text-neutral-500 bg-white border border-neutral-300 rounded-e-lg hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
