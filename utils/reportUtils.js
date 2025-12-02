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
  // Handle different report types with specific formatting
  switch (category) {
    case 'blood-test':
      return normalizeBloodTest(results);
    case 'urine-test':
      return normalizeUrineTest(results);
    case 'x-ray':
      return normalizeXRayResults(results);
    case 'mri':
      return normalizeMRIResults(results);
    default:
      return results;
  }
};

/**
 * Normalize blood test results
 */
const normalizeBloodTest = (results) => {
  // Standardize blood test result format
  const normalized = {
    hemoglobin: null,
    rbc: null,
    wbc: null,
    platelets: null,
    glucose: null,
    cholesterol: null,
    creatinine: null,
    bilirubin: null,
    ...results
  };
  
  return normalized;
};

/**
 * Normalize urine test results
 */
const normalizeUrineTest = (results) => {
  // Standardize urine test result format
  const normalized = {
    color: null,
    clarity: null,
    ph: null,
    protein: null,
    glucose: null,
    ketones: null,
    bilirubin: null,
    urobilinogen: null,
    ...results
  };
  
  return normalized;
};

/**
 * Normalize X-Ray results
 */
const normalizeXRayResults = (results) => {
  // Standardize X-Ray result format
  const normalized = {
    findings: '',
    impressions: '',
    recommendations: '',
    ...results
  };
  
  return normalized;
};

/**
 * Normalize MRI results
 */
const normalizeMRIResults = (results) => {
  // Standardize MRI result format
  const normalized = {
    region: '',
    findings: '',
    impressions: '',
    measurements: {},
    recommendations: '',
    ...results
  };
  
  return normalized;
};

/**
 * Get abnormal values from test results
 */
const getAbnormalValues = (results, category) => {
  const abnormalities = [];
  
  // Define normal ranges for different test types
  const normalRanges = {
    'blood-test': {
      hemoglobin: { min: 12, max: 18 },
      rbc: { min: 4.0, max: 5.9 },
      wbc: { min: 4.0, max: 11.0 },
      platelets: { min: 150, max: 450 },
      glucose: { min: 70, max: 100 },
      cholesterol: { min: 125, max: 200 },
      creatinine: { min: 0.6, max: 1.2 },
      bilirubin: { min: 0.1, max: 1.2 }
    }
  };
  
  if (normalRanges[category]) {
    const ranges = normalRanges[category];
    
    for (const key in results) {
      if (ranges[key] && results[key] !== null && results[key] !== undefined) {
        const value = parseFloat(results[key]);
        if (!isNaN(value)) {
          if (value < ranges[key].min || value > ranges[key].max) {
            abnormalities.push({
              testName: key,
              value: results[key],
              normalRange: `${ranges[key].min} - ${ranges[key].max}`,
              status: value < ranges[key].min ? 'low' : 'high'
            });
          }
        }
      }
    }
  }
  
  return abnormalities;
};

export {
  getReportStatistics,
  normalizeTestResults,
  getAbnormalValues
};