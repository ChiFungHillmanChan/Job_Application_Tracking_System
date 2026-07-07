class BaseJobBoardAdapter {
  constructor(name) {
    this.name = name;
  }

  async search(query, location, filters) {
    throw new Error(`${this.name}: search() not implemented`);
  }

  async getJobDetails(jobId) {
    throw new Error(`${this.name}: getJobDetails() not implemented`);
  }

  canAutoApply() {
    return false;
  }

  async submitApplication(job, profile, documents) {
    throw new Error(`${this.name}: submitApplication() not implemented`);
  }

  isConfigured() {
    return false;
  }

  standardizeJob(rawJob) {
    throw new Error(`${this.name}: standardizeJob() not implemented`);
  }
}

module.exports = BaseJobBoardAdapter;
