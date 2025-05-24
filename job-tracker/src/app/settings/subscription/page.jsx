'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import withAuth from '@/lib/withAuth';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

function SubscriptionPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showBillingHistory, setShowBillingHistory] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle success/cancel parameters from Stripe redirect
  useEffect(() => {
    if (!searchParams) return;
    
    try {
      const success = searchParams.get('success');
      const cancelled = searchParams.get('cancelled');
      
      if (success === 'true') {
        setSuccessMessage('Payment successful! Your subscription has been activated.');
        // Clear the URL parameters
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/settings/subscription');
        }
      } else if (cancelled === 'true') {
        setErrorMessage('Payment was cancelled. You can try again anytime.');
        // Clear the URL parameters
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/settings/subscription');
        }
      }
    } catch (error) {
      console.error('Error handling URL parameters:', error);
    }
  }, [searchParams]);

  // Get current user plan ID for comparison
  const getUserPlanId = () => {
    switch (user?.subscriptionTier) {
      case 'enterprise':
        return 'pro';
      case 'premium':
        return 'plus';
      case 'free':
      default:
        return 'free';
    }
  };

  // Function to determine if a plan is an upgrade or downgrade
  const getPlanRank = (planId) => {
    switch (planId) {
      case 'pro':
        return 3;
      case 'plus':
        return 2;
      case 'free':
      default:
        return 1;
    }
  };

  // Get appropriate button text based on plan comparison
  const getButtonText = (plan) => {
    const currentPlanId = getUserPlanId();
    
    if (plan.current) {
      return 'Current Plan';
    }
    
    if (isUpgrading && selectedPlan === plan.id) {
      return 'Processing...';
    }
    
    const isUpgrade = getPlanRank(plan.id) > getPlanRank(currentPlanId);
    const isDowngrade = getPlanRank(plan.id) < getPlanRank(currentPlanId);
    
    if (isUpgrade) {
      return `Upgrade to ${plan.name}`;
    }
    
    if (isDowngrade) {
      return `Downgrade to ${plan.name}`;
    }
    
    return `Select ${plan.name} Plan`;
  };

  // Plan configurations
  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started with job tracking',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        'Up to 8 resume versions',
        'Up to 50 job applications',
        'Basic application tracking',
        'Standard email support',
        'Export to PDF/CSV'
      ],
      limitations: [
        'Limited resume storage',
        'Limited job application history',
        'No priority support'
      ],
      popular: false,
      current: user?.subscriptionTier === 'free'
    },
    {
      id: 'plus',
      name: 'Plus',
      description: 'Unlimited tracking for serious job seekers',
      monthlyPrice: 8.88,
      annualPrice: 74.77, // 30% off
      features: [
        'Unlimited resume versions',
        'Unlimited job applications',
        'Advanced filtering & search',
        'Application analytics & insights',
        'Priority email support',
        'Advanced export options',
        'Custom tags & categories',
        'Application deadline reminders'
      ],
      limitations: [],
      popular: true,
      current: user?.subscriptionTier === 'premium'
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Everything in Plus, plus exclusive features',
      monthlyPrice: 38.88,
      annualPrice: 327.34, // 30% off
      features: [
        'Everything in Plus',
        'AI-powered resume optimization',
        '1-on-1 resume consultation',
        'Early access to new features',
        'Beta testing participation',
        'Priority feature requests',
        'Dedicated account manager',
        'Advanced API access'
      ],
      limitations: [],
      popular: false,
      current: user?.subscriptionTier === 'enterprise'
    }
  ];

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  const getEffectivePrice = (plan) => {
    return billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  };

  const getMonthlySavings = (plan) => {
    if (billingCycle === 'annual' && plan.monthlyPrice > 0) {
      const annualMonthly = plan.annualPrice / 12;
      const savings = plan.monthlyPrice - annualMonthly;
      return savings;
    }
    return 0;
  };

  const handlePlanSelection = async (plan) => {
    if (plan.current) return;
    
    setSelectedPlan(plan.id);
    setIsUpgrading(true);

    try {
      if (plan.id === 'free') {
        // Simulate downgrade to free plan
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert('Successfully downgraded to Free plan. Your paid features will remain active until the end of your billing period.');
        window.location.reload();
      } else {
        // Simulate upgrade process
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert(`Successfully upgraded to ${plan.name} plan! In production, this would redirect to Stripe checkout.`);
      }
    } catch (error) {
      console.error('Error processing plan change:', error);
      const errorMessage = 'There was an error processing your request. Please try again.';
      setErrorMessage(errorMessage);
    } finally {
      setIsUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const currentPlan = plans.find(plan => plan.current);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <Link
          href="/settings"
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mr-6"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-1" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          Back to Settings
        </Link>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md dark:bg-green-900 dark:text-green-300">
          <div className="flex">
            <svg className="flex-shrink-0 w-5 h-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-300">
          <div className="flex">
            <svg className="flex-shrink-0 w-5 h-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Choose Your Plan
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Upgrade your job tracking experience with unlimited features
        </p>
        
        {currentPlan && (
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium dark:bg-green-900 dark:text-green-200">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Currently on {currentPlan.name} Plan
          </div>
        )}
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billingCycle === 'annual'
                ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Annual
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Save 30%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => {
          const effectivePrice = getEffectivePrice(plan);
          const monthlySavings = getMonthlySavings(plan);
          
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'border-2 border-primary-500 bg-white dark:bg-gray-800 shadow-xl'
                  : 'border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {plan.current && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>
                
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(effectivePrice)}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-gray-600 dark:text-gray-400">
                      /{billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  )}
                  
                  {billingCycle === 'annual' && monthlySavings > 0 && (
                    <div className="mt-2">
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Save {formatPrice(monthlySavings)}/month
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <button
                  onClick={() => handlePlanSelection(plan)}
                  disabled={plan.current || (isUpgrading && selectedPlan === plan.id)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.current
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500'
                  } ${isUpgrading && selectedPlan === plan.id ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isUpgrading && selectedPlan === plan.id ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    getButtonText(plan)
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Can I change plans anytime?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              What happens to my data if I downgrade?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your data is preserved but access may be limited based on your new plan's restrictions.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We offer a 10-day money-back guarantee in certain areas. Feel free to reach out to see if your order qualifies!
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              How does annual billing work?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Annual billing charges you once per year and includes a 30% discount compared to monthly billing.
            </p>
          </div>
        </div>
      </div>

      {/* Billing History Section */}
      {user?.subscriptionTier !== 'free' && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Billing & Usage
            </h2>
            <button
              onClick={() => setShowBillingHistory(!showBillingHistory)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {showBillingHistory ? 'Hide' : 'Show'} Billing History
            </button>
          </div>
          
          {showBillingHistory && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Billing History
              </h3>
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No billing history</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your billing history will appear here once you upgrade to a paid plan.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <svg className="flex-shrink-0 w-5 h-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Secure Payments
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              All payments are processed securely through Stripe. We never store your payment information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(SubscriptionPage);