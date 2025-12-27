"use client"

import { FlyoutProvider } from '@/app/flyout-context'
import { useState } from 'react'
import MessagesSidebar from './messages-sidebar'
import MessagesBody from './messages-body'

function MessagesContent() {
  const [selectedReplyId, setSelectedReplyId] = useState<string | null>(null)

  return (
    <div className="relative flex h-full">
      <MessagesSidebar selectedReplyId={selectedReplyId} onSelectReply={setSelectedReplyId} />
      <MessagesBody selectedReplyId={selectedReplyId} />
    </div>
  )
}

export default function Messages() {
  return (
    <FlyoutProvider initialState={true}>
      <MessagesContent />
    </FlyoutProvider>
  )
}