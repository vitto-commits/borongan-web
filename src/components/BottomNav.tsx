'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, ClipboardDocumentListIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconSolid, ClipboardDocumentListIcon as ClipboardSolid, UserCircleIcon as UserSolid } from '@heroicons/react/24/solid'

const tabs = [
  { href: '/', label: 'Home', Icon: HomeIcon, ActiveIcon: HomeIconSolid },
  { href: '/services', label: 'Services', Icon: ClipboardDocumentListIcon, ActiveIcon: ClipboardSolid },
  { href: '/profile', label: 'Profile', Icon: UserCircleIcon, ActiveIcon: UserSolid },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {tabs.map(({ href, label, Icon, ActiveIcon }) => {
          const active = pathname === href
          const IconComp = active ? ActiveIcon : Icon
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-4 py-1">
              <IconComp className={`w-6 h-6 ${active ? 'text-navy' : 'text-gray-400'}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-navy' : 'text-gray-400'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
