export default function MessagesFooter() {
  return (
    <div className="sticky bottom-0">
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 md:px-5 h-16 flex items-center justify-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Campaign replies are read-only. Forward or reply directly from your email client.
        </div>
      </div>
    </div>
  )
}