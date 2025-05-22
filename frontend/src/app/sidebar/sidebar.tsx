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
    const isActive = (path: string) => pathname === path;

    return (
        <>
            {/* 햄버거 버튼: 사이드바가 닫혀 있을 때만 좌상단에 고정 */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="
                        fixed top-4 left-4 z-[1100]
                        bg-white border border-gray-300 shadow
                        rounded-full p-3
                        flex items-center justify-center
                        hover:bg-blue-50 active:bg-blue-100
                        transition-all duration-150
                    "
                    style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.07)" }}
                    aria-label="사이드바 열기"
                >
                    <MenuIcon size={22} className="text-blue-600" />
                </button>
            )}

            {/* 사이드바 패널 */}
            <div
                className={`
                    fixed top-0 left-0 h-full z-[1050]
                    transition-transform duration-300
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
                style={{ width: 250, minWidth: 220, maxWidth: 320 }}
            >
                <ProSidebar
                    collapsed={!sidebarOpen}
                    width="100%"
                    collapsedWidth="0px"
                    className="h-full bg-[#f4f6fa] border-r border-gray-200 shadow-lg"
                >
                    <div className="flex flex-col h-full p-4">
                        {/* 닫기(X) 버튼 - 우상단에 고정 */}
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-bold text-lg pl-2 select-none">Menu</div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="
                                    p-1 rounded-full text-gray-700 hover:bg-gray-200 transition-colors
                                    flex items-center justify-center
                                "
                                aria-label="사이드바 닫기"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* 메뉴 */}
                        <Menu className="mt-4 flex-1">
                            {[
                                { label: '시간표', icon: <Calendar size={18} />, path: '/' },
                                { label: '커뮤니티', icon: <MessageSquare size={18} />, path: '/community' },
                                { label: '설정', icon: <Settings size={18} />, path: '/settings' },
                            ].map(({ label, icon, path }) => (
                                <MenuItem
                                    key={path}
                                    icon={icon}
                                    className={`mb-2 rounded-lg
                                        ${isActive(path)
                                        ? 'text-blue-700 bg-blue-100 font-bold'
                                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                                    }
                                        transition-colors
                                    `}
                                    onClick={() => router.push(path)}
                                >
                                    <span className="text-base">{label}</span>
                                </MenuItem>
                            ))}
                        </Menu>
                    </div>
                </ProSidebar>
            </div>
        </>
    );
}
