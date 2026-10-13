import { IconRefresh } from './Icons'

export function ConnectionBanner() {
  return (
    <div role="status" className="banner">
      <IconRefresh style={{ width: 18, height: 18 }} />
      連線中斷,重新連線中…
    </div>
  )
}
