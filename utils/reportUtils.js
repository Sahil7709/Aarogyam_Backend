// Utility functions for handling medical reports and statistics

/**
 * Get report type statistics for a user
 */
const getReportStatistics = (reports) => {
  const stats = {
    totalReports: reports.length,
    byType: {},
    byMonth: {},
    recentReports: []
  };

  // Count reports by type
  reports.forEach(report => {
    if (!stats.byType[report.category]) {
      stats.byType[report.category] = 0;
    }
    stats.byType[report.category]++;
  });

  // Count reports by month
  reports.forEach(report => {
    const monthYear = new Date(report.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!stats.byMonth[monthYear]) {
      stats.byMonth[monthYear] = 0;
    }
    stats.byMonth[monthYear]++;
  });

  // Get recent reports (last 5)
  stats.recentReports = reports
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return stats;
};

/**
 * Normalize different test result formats
 */
const normalizeTestResults = (results, category) => {
  // For our new flexible approach, we don't need to normalize specific fields
  // Just return the results as they are
  return results;
};

/**
 * Get abnormal values from test results
 * For our simplified approach, we'll return an empty array since we're not 
 * doing specific medical validations
 */
const getAbnormalValues = (results, category) => {
  // Since we're using a flexible key-value approach, we don't have predefined
  // normal ranges. Return empty array for now.
  return [];
};

export {
  getReportStatistics,
  normalizeTestResults,
  getAbnormalValues
};