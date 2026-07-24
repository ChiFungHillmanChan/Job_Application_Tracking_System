// src/components/forms/JobForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jobService from '@/lib/jobService';
import resumeService from '@/lib/resumeService';

const JobForm = ({ initialData = null, onSuccess, onCancel }) => {
  const router = useRouter();
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    status: 'Saved',
    jobType: 'full-time',
    workType: 'onsite',
    url: '',
    salary: '',
    applicationDate: new Date().toISOString().split('T')[0],
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    notes: '',
    tags: '',
    resume: ''
  });
  
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Status options matching the backend enum
  const statusOptions = [
    'Saved',
    'Applied',
    'Phone Screen',
    'Interview',
    'Technical Assessment',
    'Offer',
    'Rejected',
    'Withdrawn'
  ];

  // Job type options matching the backend enum.
  //
  // These are { value, label } pairs because the stored value must be exactly
  // one of the Job schema's enum members. The previous list submitted display
  // strings ('Full-time', 'Contract', ...) which are case-mismatched against the
  // enum ('full-time', 'contract', ...), and 'Remote'/'Other' are not job types
  // at all - so every save failed validation with a 400.
  const jobTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'permanent', label: 'Permanent' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' }
  ];

  // 'Remote' used to be offered as a job type; it is really a work arrangement,
  // which the Job schema models separately as `workType`.
  const workTypeOptions = [
    { value: 'onsite', label: 'On-site' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      // Read back from the real schema paths (applicationUrl / contactPerson.* /
      // resumeUsed). The flat names below are form-local only.
      setFormData({
        company: initialData.company || '',
        position: initialData.position || '',
        location: initialData.location || '',
        status: initialData.status || 'Saved',
        jobType: initialData.jobType || 'full-time',
        workType: initialData.workType || 'onsite',
        url: initialData.applicationUrl || '',
        salary: initialData.salary || '',
        applicationDate: initialData.applicationDate
          ? new Date(initialData.applicationDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        contactName: initialData.contactPerson?.name || '',
        contactEmail: initialData.contactPerson?.email || '',
        contactPhone: initialData.contactPerson?.phone || '',
        description: initialData.description || '',
        notes: initialData.notes || '',
        tags: initialData.tags ? initialData.tags.join(', ') : '',
        resume: initialData.resumeUsed?._id || initialData.resumeUsed || ''
      });

      // Show advanced section if any advanced fields have data
      if (initialData.applicationUrl || initialData.salary ||
          initialData.contactPerson?.name || initialData.contactPerson?.email ||
          initialData.contactPerson?.phone ||
          initialData.description || initialData.notes || initialData.tags?.length) {
        setShowAdvanced(true);
      }
    }
  }, [initialData]);

  // Load user's resumes
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await resumeService.getAllResumes();
        if (response && response.success) {
          setResumes(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching resumes:', error);
      }
    };
    
    fetchResumes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.company || !formData.position || !formData.location || !formData.status) {
      setError('Please fill in all required fields: Company, Position, Location, and Status');
      setLoading(false);
      return;
    }

    try {
      // Prepare data for submission, translating the flat form fields onto the
      // Job schema's actual paths. Previously `url`, `contactName`,
      // `contactEmail`, `contactPhone` and `resume` were posted as-is; none of
      // them are schema paths, so Mongoose's strict mode dropped them silently
      // and everything the user typed into the advanced section was discarded.
      const submitData = {
        company: formData.company,
        position: formData.position,
        location: formData.location,
        status: formData.status,
        jobType: formData.jobType,
        workType: formData.workType,
        applicationUrl: formData.url,
        salary: formData.salary,
        description: formData.description,
        notes: formData.notes,
        tags: formData.tags
          ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
          : [],
        applicationDate: formData.applicationDate ? new Date(formData.applicationDate) : new Date(),
        contactPerson: {
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone
        },
        resumeUsed: formData.resume || undefined
      };

      // Drop empty contact fields, then the whole object if nothing was filled
      // in (an all-empty contactPerson would fail the email format validator).
      Object.keys(submitData.contactPerson).forEach(key => {
        if (!submitData.contactPerson[key]) delete submitData.contactPerson[key];
      });
      if (Object.keys(submitData.contactPerson).length === 0) {
        delete submitData.contactPerson;
      }

      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      let response;
      if (isEditing) {
        response = await jobService.updateJob(initialData._id, submitData);
      } else {
        response = await jobService.createJob(submitData);
      }

      if (response && response.success) {
        setSuccess(`Job application ${isEditing ? 'updated' : 'created'} successfully!`);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(response.data);
        } else {
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } else {
        setError(`Failed to ${isEditing ? 'update' : 'create'} job application`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} job:`, error);
      setError(
        error.response?.data?.error || 
        `Failed to ${isEditing ? 'update' : 'create'} job application. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Job Application' : 'Add New Job Application'}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isEditing ? 'Update your job application details' : 'Track a new job opportunity'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm dark:bg-green-900 dark:text-green-300">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Required Fields Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Basic Information <span className="text-red-500">*</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company"
                name="company"
                required
                value={formData.company}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="e.g. Google, Microsoft, Startup Inc."
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="position"
                name="position"
                required
                value={formData.position}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="e.g. Software Engineer, Product Manager"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="e.g. San Francisco, CA / Remote"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="input-field mt-1"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Job Type
              </label>
              <select
                id="jobType"
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                className="input-field mt-1"
              >
                {jobTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="workType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Work Arrangement
              </label>
              <select
                id="workType"
                name="workType"
                value={formData.workType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {workTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="applicationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Application Date
              </label>
              <input
                type="date"
                id="applicationDate"
                name="applicationDate"
                value={formData.applicationDate}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>
          </div>
        </div>

        {/* Advanced Fields Toggle */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {showAdvanced ? 'Hide' : 'Show'} Additional Details
            <svg 
              className={`ml-2 h-4 w-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Advanced Fields Section */}
        {showAdvanced && (
          <div className="space-y-6">
            {/* Job Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Job Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Job Posting URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="https://company.com/jobs/123"
                  />
                </div>

                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="e.g. $80k-$120k, $50/hr, Negotiable"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="resume" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Resume Used
                  </label>
                  <select
                    id="resume"
                    name="resume"
                    value={formData.resume}
                    onChange={handleChange}
                    className="input-field mt-1"
                  >
                    <option value="">Select a resume (optional)</option>
                    {resumes.map(resume => (
                      <option key={resume._id} value={resume._id}>
                        {resume.name} {resume.isDefault ? '(Default)' : ''} - v{resume.version || '1.0'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="e.g. John Smith"
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="recruiter@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Additional Information
              </h3>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Key responsibilities, requirements, or job description highlights..."
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Personal Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Interview prep notes, follow-up reminders, personal thoughts..."
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="e.g. remote, startup, dream-job, urgent (comma separated)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Separate tags with commas for easy filtering and organization
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              isEditing ? 'Update Application' : 'Create Application'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;