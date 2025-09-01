import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showInfo = true,
  totalItems = null,
  itemsPerPage = null 
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col items-center space-y-4 mt-8">
      {/* Info Section */}
      {showInfo && totalItems && itemsPerPage && (
        <div className="text-sm text-gray-600 text-center">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-center">
        {/* Mobile View */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`
              inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
              ${currentPage <= 1
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-[#366c6b] hover:text-[#366c6b] shadow-sm hover:shadow-md'
              }
            `}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
            {currentPage} / {totalPages}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`
              inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
              ${currentPage >= totalPages
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-[#366c6b] hover:text-[#366c6b] shadow-sm hover:shadow-md'
              }
            `}
          >
            Next
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex items-center space-x-1">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`
              inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
              ${currentPage <= 1
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-[#366c6b] hover:text-[#366c6b] shadow-sm hover:shadow-md'
              }
            `}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1 mx-2">
            {visiblePages.map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-sm text-gray-500">...</span>
                ) : (
                  <button
                    onClick={() => onPageChange(page)}
                    className={`
                      inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg border transition-all duration-200
                      ${page === currentPage
                        ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white border-[#366c6b] shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-[#366c6b] hover:text-[#366c6b] shadow-sm hover:shadow-md'
                      }
                    `}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`
              inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
              ${currentPage >= totalPages
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-[#366c6b] hover:text-[#366c6b] shadow-sm hover:shadow-md'
              }
            `}
          >
            Next
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
