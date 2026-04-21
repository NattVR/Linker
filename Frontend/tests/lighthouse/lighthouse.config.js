module.exports = {
  thresholds: {
    performance: 50,
    accessibility: 80,
    'best-practices': 80,
    seo: 80,
  },
  lighthouseFlags: {
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: null,
  },
};