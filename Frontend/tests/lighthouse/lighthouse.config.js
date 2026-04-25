module.exports = {
  thresholds: {
    performance: 50,
    accessibility: 75,
    'best-practices': 75,
    seo: 80,
  },
  lighthouseFlags: {
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: null,
  },
};