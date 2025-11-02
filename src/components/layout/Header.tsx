'use client';

import { Menu, Transition } from '@headlessui/react';
import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Fragment } from 'react';
import { LocaleSwitcher } from '../LocaleSwitcher';

type HeaderProps = {
  userName: string;
  userEmail: string;
  onMenuClick: () => void;
  onSignOut: () => void;
};

export function Header({ userName, userEmail, onMenuClick, onSignOut }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
      {/* Mobile menu button */}
      <button
        type="button"
        className="rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none lg:hidden"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Right side: User menu */}
      <div className="ml-auto flex items-center gap-4">
        {/* Locale switcher */}
        <LocaleSwitcher />

        {/* User dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none">
            <UserCircleIcon className="h-6 w-6 text-gray-700" aria-hidden="true" />
            <span className="hidden font-medium text-gray-900 sm:block">
              {userName}
            </span>
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="ring-opacity-5 absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none">
              <div className="border-b border-gray-200 px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="truncate text-sm text-gray-500">{userEmail}</p>
              </div>

              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/dashboard/user-profile"
                      className={`block px-4 py-2 text-sm ${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      Profile Settings
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={onSignOut}
                      className={`block w-full px-4 py-2 text-left text-sm ${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      Sign Out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
