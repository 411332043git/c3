import { nickColor } from '../lib/nickname'
import type { PresenceUser } from '../services/types'
import { IconUsers } from './Icons'

export function OnlineList({ users, myUserId }: { users: PresenceUser[]; myUserId: string }) {
  return (
    <>
      <h2 className="online__title">
        <IconUsers style={{ width: 18, height: 18 }} />
        線上 {users.length} 人
      </h2>
      <ul className="online__list">
        {users.map((u) => {
          const me = u.userId === myUserId
          const color = nickColor(u.nickname)
          return (
            <li key={u.userId} className={me ? 'online__item online__item--me' : 'online__item'}>
              <span className="dot" style={{ background: color }} />
              <span className="online__name" style={{ color }}>
                {u.nickname}
              </span>
              {me && <span className="badge">你</span>}
            </li>
          )
        })}
      </ul>
    </>
  )
}
