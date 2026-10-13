import { useState } from 'react'
import { ChatScreen } from './components/ChatScreen'
import { JoinScreen } from './components/JoinScreen'
import { chat } from './services'
import type { PresenceUser } from './services/types'

export interface Session {
  userId: string
  nickname: string
  online: PresenceUser[]
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  if (!session) return <JoinScreen onJoined={setSession} />

  return (
    <ChatScreen
      session={session}
      onLeave={async () => {
        await chat.leave()
        setSession(null)
      }}
    />
  )
}
