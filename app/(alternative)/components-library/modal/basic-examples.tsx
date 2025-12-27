'use client'

import { useState } from 'react'
import ModalBasic from '@/components/modal-basic'
import ModalCookies from '@/components/modal-cookies'

export default function BasicExamples() {

  const [basicModalOpen, setBasicModalOpen] = useState<boolean>(false)
  const [scrollbarModalOpen, setScrollbarModalOpen] = useState<boolean>(false)
  const [cookiesModalOpen, setCookiesModalOpen] = useState<boolean>(false)  

  return (
    <div>
      <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-6">Basic</h2>
      <div className="flex flex-wrap items-center -m-1.5">

        {/* Basic Modal */}
        <div className="m-1.5">
          {/* Start */}
          <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white" onClick={() => { setBasicModalOpen(true) }}>Basic Modal</button>
          <ModalBasic isOpen={basicModalOpen} setIsOpen={setBasicModalOpen} title="Basic Modal">
            {/* Modal content */}
            <div className="px-5 pt-4 pb-1">
              <div className="text-sm">
                <div className="font-medium text-gray-800 dark:text-gray-100 mb-2">Confirm send</div>
                <div className="space-y-2">
                  <p>Confirm you want to launch this campaign to the selected audience. Warmup caps, provider limits, and unsubscribe checks will be enforced automatically.</p>
                  <p>If you need to edit recipients or content, close this dialog and adjust the campaign before sending.</p>
                </div>
              </div>
            </div>
            {/* Modal footer */}
            <div className="px-5 py-4">
              <div className="flex flex-wrap justify-end space-x-2">
                <button className="btn-sm border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300" onClick={() => { setBasicModalOpen(false) }}>Close</button>
                <button className="btn-sm bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">I Understand</button>
              </div>
            </div>
          </ModalBasic>
          {/* End */}
        </div>

        {/* Modal w/ Scroll Bar */}
        <div className="m-1.5">
          {/* Start */}
          <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white" onClick={() => { setScrollbarModalOpen(true) }}>Modal w/ Scroll Bar</button>
          <ModalBasic isOpen={scrollbarModalOpen} setIsOpen={setScrollbarModalOpen} title="Modal w/ Scroll Bar">
            {/* Modal content */}
            <div className="px-5 py-4">
              <div className="text-sm">
                <div className="font-medium text-gray-800 dark:text-gray-100 mb-2">Review changes</div>
                <div className="space-y-2">
                  <p>Scroll to review what will change: updated subject line, new from address, and a refreshed unsubscribe footer.</p>
                  <p>We’ll run a final lint for merge tags and links before sending. If anything fails validation, this modal will surface the exact field to fix.</p>
                  <p>Attachments are not supported; include links instead to avoid spam filters.</p>
                  <p>Warmup and provider limits still apply. If the batch is larger than your remaining quota, we will queue and resume after reset.</p>
                  <p>Need to pause? Close and use the campaign status menu to stop sending.</p>
                  <p>Questions? Open Help from the header to contact support.</p>
                </div>
              </div>
            </div>
            {/* Modal footer */}
            <div className="sticky bottom-0 px-5 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700/60">
              <div className="flex flex-wrap justify-end space-x-2">
                <button className="btn-sm border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300" onClick={() => { setScrollbarModalOpen(false) }}>Close</button>
                <button className="btn-sm bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">I Understand</button>
              </div>
            </div>
          </ModalBasic>
          {/* End */}
        </div>        
        

        {/* Cookies */}
        <div className="m-1.5">
          {/* Start */}
          <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white" aria-controls="cookies-modal" onClick={() => { setCookiesModalOpen(true) }}>Cookies</button>
          <ModalCookies isOpen={cookiesModalOpen} setIsOpen={setCookiesModalOpen} title="We use cookies 🍪">
            {/* Modal content */}
            <div className="text-sm mb-5">
              <div className="space-y-2">
                <p>We use cookies to keep you signed in, remember workspace context, and measure deliverability. Analytics cookies are limited to product usage and never shared.</p>
                <p>You can disable non-essential cookies in Settings → Privacy. Essential cookies are required for authentication and billing.</p>
              </div>
            </div>
            {/* Modal footer */}
            <div className="flex flex-wrap justify-end space-x-2">
              <button className="btn-sm border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300" onClick={() => { setCookiesModalOpen(false) }}>Decline</button>
              <button className="btn-sm bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white" onClick={() => { setCookiesModalOpen(false) }}>I Accept</button>
            </div>
          </ModalCookies>
          {/* End */}
        </div>  

      </div>
    </div>
  )
}
