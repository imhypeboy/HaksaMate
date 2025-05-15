'use client';

import { Sidebar as ProSidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Calendar, MessageSquare, Settings, X, Menu as MenuIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
g
    const isActive = (path: string) => pathname === path;

    return (
        <>
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-4 left-4 z-[9999] bg-white border border-gray-300 p-2"
                >
                    <MenuIcon size={24} className="text-gray-700" />
                </button>
            )}

            <ProSidebar
                collapsed={!sidebarOpen}
                width="250px"
                collapsedWidth="0px"
                className="bg-[#f4f6fa] border-r border-gray-200"
            >
                <div className="p-4 h-full flex flex-col">
                    {/* 사이드바 접기 버튼 */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="mb-4 flex items-center text-sm text-black"
                    >
                        <X size={16} className="mr-2 text-black" />
                        사이드바 접기
                    </button>

                    <Menu className="mt-6 flex-1">
                        {/* 공통 메뉴 아이템 스타일 */}
                        {[
                            { label: '시간표', icon: <Calendar size={18} />, path: '/' },
                            { label: '커뮤니티', icon: <MessageSquare size={18} />, path: '/community' },
                            { label: '설정', icon: <Settings size={18} />, path: '/settings' },
                        ].map(({ label, icon, path }) => (
                            <MenuItem
                                key={path}
                                icon={icon}
                                className={`mb-2 ${
                                    isActive(path) ? 'text-black bg-gray-300 ' : 'text-gray-400'
                                }`}
                                onClick={() => router.push(path)}
                            >
                                <span className="text-base">{label}</span>
                            </MenuItem>

                        ))}
                    </Menu>
                </div>
            </ProSidebar>
        </>
    );
}
