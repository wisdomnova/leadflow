export const metadata = {
  title: 'Faqs - Mosaic',
  description: 'Page description',
}

export default function Faqs() {
  return (
    <div className="relative bg-white dark:bg-gray-900 h-full">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">

        <div className="max-w-3xl m-auto">

          {/* Page title */}
          <div className="mb-5">
            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">👋 How we can help you today?</h1>
          </div>

          {/* Search form */}
          <div className="mb-6">
            <form className="relative">
              <label htmlFor="action-search" className="sr-only">Search</label>
              <input id="action-search" className="form-input pl-9 py-3 dark:bg-gray-800 focus:border-gray-300 w-full" type="search" />
              <button className="absolute inset-0 right-auto group" type="submit" aria-label="Search">
                <svg className="shrink-0 fill-current text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 ml-3 mr-2" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
                  <path d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Filters */}
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700/60">
            <ul className="text-sm font-medium flex flex-nowrap -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-scroll no-scrollbar">
              <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                <a className="text-violet-500 whitespace-nowrap" href="#0">Popular</a>
              </li>
              <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                <a className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 whitespace-nowrap" href="#0">Accessibility</a>
              </li>
              <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                <a className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 whitespace-nowrap" href="#0">Marketing</a>
              </li>
              <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                <a className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 whitespace-nowrap" href="#0">Development</a>
              </li>
              <li className="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                <a className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 whitespace-nowrap" href="#0">Account</a>
              </li>
            </ul>
          </div>

          {/* Posts */}
          <div>
            <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-4">Popular Questions</h2>
            {/* Post */}
            <article className="py-4 border-b border-gray-200 dark:border-gray-700/60">
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0 fill-current" width="16" height="16" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold">How do I connect my email provider?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-2">Go to Settings → Email Provider and choose SES. Add the access key, secret, and region for the verified identity you want to send from. We validate credentials before saving; once verified you can start campaigns immediately.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Email</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Setup</a>
                  </li>
                </ul>
              </div>
            </article>
            {/* Post */}
            <article className="py-4 border-b border-gray-200 dark:border-gray-700/60">
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0 fill-current" width="16" height="16" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold">What happens if I exceed my plan limits?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-2">We stop new sends once you hit your email or user limits to prevent overages. Upgrade your plan in Settings → Plans or contact billing to request a temporary increase.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Development</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Accessibility</a>
                  </li>
                </ul>
              </div>
            </article>
            {/* Post */}
            <article className="py-4 border-b border-gray-200 dark:border-gray-700/60">
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0 fill-current" width="16" height="16" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold">What limitations do trial accounts have?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-2">Trials include one workspace, up to 200 contacts, and 200 warmup-limited sends. Import, templates, and automations are available; webhooks and custom domains require a paid plan.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Development</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Plans</a>
                  </li>
                </ul>
              </div>
            </article>
            {/* Post */}
            <article className="py-4 border-b border-gray-200 dark:border-gray-700/60">
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0 fill-current" width="16" height="16" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold">How are Standard and Plus different?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-2">Standard includes single-seat access, basic analytics, and warmup. Plus adds multi-seat workspaces, sequences, reply classification, and higher send limits. Both include the customer portal for billing.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Development</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Account</a>
                  </li>
                </ul>
              </div>
            </article>
            {/* Post */}
            <article className="py-4 border-b border-gray-200 dark:border-gray-700/60">
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0 fill-current" width="16" height="16" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold">Is my personal information protected?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-2">We store credentials encrypted at rest, scope access per workspace, and log all admin actions. Email content and events are retained per your data retention settings; delete a workspace to purge associated data.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">General</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Accessibility</a>
                  </li>
                </ul>
              </div>
            </article>
            {/* Post */}
            <article className="py-4 border-b border-gray-200 dark:border-gray-700/60">
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0 fill-current" width="16" height="16" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold">What can I create with this product?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-2">You can build cold outreach campaigns, multi-step sequences, and transactional updates. Import contacts, apply tags, and use merge fields like firstName and company to personalize each send.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Marketing</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Plans</a>
                  </li>
                </ul>
              </div>
            </article>
          </div>

          {/* Pagination */}
          <div className="mt-6">
            <div className="flex justify-end">
              <a className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300" href="#0">See All Questions -&gt;</a>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}