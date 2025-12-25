'use strict';

function calculatePaginationParameters(reqQuery, totalCount, limit = 10) { 
    const page = parseInt(reqQuery.page) || 1;
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);
    return { page, limit, offset, totalPages };
};

function paginationMetadata({ page, limit, totalPages, totalCount }) { 
    return {
        current_page: page,
        total_pages: totalPages,
        total_records: totalCount,
        limit: limit,
        has_next: page < totalPages,
        has_prev: page > 1,
    };
};

module.exports = {
    calculatePaginationParameters,
    paginationMetadata
}