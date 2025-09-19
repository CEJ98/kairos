/**
 * Enhanced Navigation Components
 * Improved navigation patterns and user flows
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
	Home, 
	Dumbbell, 
	TrendingUp, 
	User, 
	Settings, 
	Menu, 
	X, 
	ChevronDown,
	Bell,
	Search,
	Plus,
	LogOut,
	Moon,
	Sun,
	Monitor
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuLabel, 
	DropdownMenuSeparator, 
	DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Navigation Item Interface
interface NavItem {
	id: string
	label: string
	icon: React.ReactNode
	href: string
	badge?: number
	children?: NavItem[]
	isActive?: boolean
	requiresAuth?: boolean
}

// Enhanced Sidebar Navigation
interface EnhancedSidebarProps {
	items: NavItem[]
	currentPath: string
	onNavigate: (href: string) => void
	isCollapsed?: boolean
	onToggleCollapse?: () => void
	user?: {
		name: string
		email: string
		avatar?: string
		role?: string
	}
	notificationCount?: number
	className?: string
}

export function EnhancedSidebar({
	items,
	currentPath,
	onNavigate,
	isCollapsed = false,
	onToggleCollapse,
	user,
	notificationCount = 0,
	className
}: EnhancedSidebarProps) {
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

	const toggleExpanded = (itemId: string) => {
		setExpandedItems(prev => {
			const newSet = new Set(prev)
			if (newSet.has(itemId)) {
				newSet.delete(itemId)
			} else {
				newSet.add(itemId)
			}
			return newSet
		})
	}

	const renderNavItem = (item: NavItem, level = 0) => {
		const isActive = currentPath === item.href
		const hasChildren = item.children && item.children.length > 0
		const isExpanded = expandedItems.has(item.id)

		return (
			<div key={item.id}>
				<motion.div
					whileHover={{ x: isCollapsed ? 0 : 4 }}
					whileTap={{ scale: 0.98 }}
					className={cn(
						'group relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer',
						level > 0 && 'ml-4',
						isActive 
							? 'bg-primary text-primary-foreground shadow-sm' 
							: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
					)}
					onClick={() => {
						if (hasChildren && !isCollapsed) {
							toggleExpanded(item.id)
						} else {
							onNavigate(item.href)
						}
					}}
				>
					<div className="flex h-5 w-5 items-center justify-center">
						{item.icon}
					</div>
					
					<AnimatePresence>
						{!isCollapsed && (
							<motion.div
								initial={{ opacity: 0, width: 0 }}
								animate={{ opacity: 1, width: 'auto' }}
								exit={{ opacity: 0, width: 0 }}
								className="ml-3 flex-1 flex items-center justify-between"
							>
								<span>{item.label}</span>
								<div className="flex items-center space-x-1">
									{item.badge && item.badge > 0 && (
										<Badge variant="secondary" className="h-5 px-1.5 text-xs">
											{item.badge > 99 ? '99+' : item.badge}
										</Badge>
									)}
									{hasChildren && (
										<ChevronDown 
											className={cn(
												'h-4 w-4 transition-transform duration-200',
												isExpanded && 'rotate-180'
											)}
										/>
									)}
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Active indicator */}
					{isActive && (
						<motion.div
							layoutId="activeIndicator"
							className="absolute left-0 top-0 h-full w-1 bg-primary-foreground rounded-r"
						/>
					)}
				</motion.div>

				{/* Children */}
				<AnimatePresence>
					{hasChildren && isExpanded && !isCollapsed && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className="mt-1 space-y-1"
						>
							{item.children?.map(child => renderNavItem(child, level + 1))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		)
	}

	return (
		<motion.aside
			initial={false}
			animate={{ width: isCollapsed ? 80 : 280 }}
			transition={{ duration: 0.3, ease: 'easeInOut' }}
			className={cn(
				'flex flex-col bg-card border-r border-border h-full',
				className
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-border">
				<AnimatePresence>
					{!isCollapsed && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="flex items-center space-x-2"
						>
							<Dumbbell className="h-6 w-6 text-primary" />
							<span className="text-lg font-bold">Kairos</span>
						</motion.div>
					)}
				</AnimatePresence>
				
				{onToggleCollapse && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onToggleCollapse}
						className="h-8 w-8 p-0"
					>
						<Menu className="h-4 w-4" />
					</Button>
				)}
			</div>

			{/* Navigation Items */}
			<nav className="flex-1 space-y-1 p-4 overflow-y-auto">
				{items.map(item => renderNavItem(item))}
			</nav>

			{/* User Section */}
			{user && (
				<div className="border-t border-border p-4">
					<div className={cn(
						'flex items-center space-x-3',
						isCollapsed && 'justify-center'
					)}>
						<Avatar className="h-8 w-8">
							<AvatarImage src={user.avatar} alt={user.name} />
							<AvatarFallback>
								{user.name.split(' ').map(n => n[0]).join('')}
							</AvatarFallback>
						</Avatar>
						
						<AnimatePresence>
							{!isCollapsed && (
								<motion.div
									initial={{ opacity: 0, width: 0 }}
									animate={{ opacity: 1, width: 'auto' }}
									exit={{ opacity: 0, width: 0 }}
									className="flex-1 min-w-0"
								>
									<div className="text-sm font-medium truncate">{user.name}</div>
									<div className="text-xs text-muted-foreground truncate">{user.email}</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			)}
		</motion.aside>
	)
}

// Enhanced Top Navigation
interface EnhancedTopNavProps {
	title?: string
	breadcrumbs?: Array<{ label: string; href?: string }>
	actions?: React.ReactNode
	user?: {
		name: string
		email: string
		avatar?: string
	}
	notificationCount?: number
	onSearch?: (query: string) => void
	onThemeChange?: (theme: 'light' | 'dark' | 'system') => void
	currentTheme?: 'light' | 'dark' | 'system'
	onLogout?: () => void
	className?: string
}

export function EnhancedTopNav({
	title,
	breadcrumbs,
	actions,
	user,
	notificationCount = 0,
	onSearch,
	onThemeChange,
	currentTheme = 'system',
	onLogout,
	className
}: EnhancedTopNavProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [showSearch, setShowSearch] = useState(false)
	const searchRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (showSearch && searchRef.current) {
			searchRef.current.focus()
		}
	}, [showSearch])

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		if (searchQuery.trim() && onSearch) {
			onSearch(searchQuery.trim())
		}
	}

	const getThemeIcon = () => {
		switch (currentTheme) {
			case 'light':
				return <Sun className="h-4 w-4" />
			case 'dark':
				return <Moon className="h-4 w-4" />
			default:
				return <Monitor className="h-4 w-4" />
		}
	}

	return (
		<header className={cn(
			'sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
			className
		)}>
			<div className="flex h-16 items-center justify-between px-4">
				{/* Left Section */}
				<div className="flex items-center space-x-4">
					{title && (
						<div>
							<h1 className="text-lg font-semibold">{title}</h1>
							{breadcrumbs && breadcrumbs.length > 0 && (
								<nav className="flex items-center space-x-1 text-sm text-muted-foreground">
									{breadcrumbs.map((crumb, index) => (
										<React.Fragment key={index}>
											{index > 0 && <span>/</span>}
											<span className={crumb.href ? 'hover:text-foreground cursor-pointer' : ''}>
												{crumb.label}
											</span>
										</React.Fragment>
									))}
								</nav>
							)}
						</div>
					)}
				</div>

				{/* Center Section - Search */}
				{onSearch && (
					<div className="flex-1 max-w-md mx-4">
						<AnimatePresence>
							{showSearch ? (
								<motion.form
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									onSubmit={handleSearch}
									className="relative"
								>
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										ref={searchRef}
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search..."
										className="pl-10 pr-10"
										onBlur={() => {
											if (!searchQuery) {
												setShowSearch(false)
											}
										}}
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
										onClick={() => {
											setSearchQuery('')
											setShowSearch(false)
										}}
									>
										<X className="h-3 w-3" />
									</Button>
								</motion.form>
							) : (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowSearch(true)}
									className="w-full justify-start text-muted-foreground"
								>
									<Search className="h-4 w-4 mr-2" />
									Search...
								</Button>
							)}
						</AnimatePresence>
					</div>
				)}

				{/* Right Section */}
				<div className="flex items-center space-x-2">
					{actions}

					{/* Quick Actions */}
					<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
						<Plus className="h-4 w-4" />
					</Button>

					{/* Notifications */}
					<Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
						<Bell className="h-4 w-4" />
						{notificationCount > 0 && (
							<Badge 
								variant="destructive" 
								className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
							>
								{notificationCount > 9 ? '9+' : notificationCount}
							</Badge>
						)}
					</Button>

					{/* Theme Toggle */}
					{onThemeChange && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
									{getThemeIcon()}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => onThemeChange('light')}>
									<Sun className="h-4 w-4 mr-2" />
									Light
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onThemeChange('dark')}>
									<Moon className="h-4 w-4 mr-2" />
									Dark
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onThemeChange('system')}>
									<Monitor className="h-4 w-4 mr-2" />
									System
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}

					{/* User Menu */}
					{user && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-8 w-8 rounded-full p-0">
									<Avatar className="h-8 w-8">
										<AvatarImage src={user.avatar} alt={user.name} />
										<AvatarFallback>
											{user.name.split(' ').map(n => n[0]).join('')}
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium">{user.name}</p>
										<p className="text-xs text-muted-foreground">{user.email}</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<User className="h-4 w-4 mr-2" />
									Profile
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Settings className="h-4 w-4 mr-2" />
									Settings
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								{onLogout && (
									<DropdownMenuItem onClick={onLogout}>
										<LogOut className="h-4 w-4 mr-2" />
										Log out
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
		</header>
	)
}

// Mobile Navigation
interface MobileNavProps {
	items: NavItem[]
	currentPath: string
	onNavigate: (href: string) => void
	isOpen: boolean
	onClose: () => void
	user?: {
		name: string
		email: string
		avatar?: string
	}
	className?: string
}

export function MobileNav({
	items,
	currentPath,
	onNavigate,
	isOpen,
	onClose,
	user,
	className
}: MobileNavProps) {
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

	const toggleExpanded = (itemId: string) => {
		setExpandedItems(prev => {
			const newSet = new Set(prev)
			if (newSet.has(itemId)) {
				newSet.delete(itemId)
			} else {
				newSet.add(itemId)
			}
			return newSet
		})
	}

	const handleNavigate = (href: string) => {
		onNavigate(href)
		onClose()
	}

	const renderNavItem = (item: NavItem, level = 0) => {
		const isActive = currentPath === item.href
		const hasChildren = item.children && item.children.length > 0
		const isExpanded = expandedItems.has(item.id)

		return (
			<div key={item.id}>
				<div
					className={cn(
						'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
						level > 0 && 'ml-4',
						isActive 
							? 'bg-primary text-primary-foreground' 
							: 'text-foreground hover:bg-accent hover:text-accent-foreground'
					)}
					onClick={() => {
						if (hasChildren) {
							toggleExpanded(item.id)
						} else {
							handleNavigate(item.href)
						}
					}}
				>
					<div className="flex items-center space-x-3">
						<div className="flex h-5 w-5 items-center justify-center">
							{item.icon}
						</div>
						<span>{item.label}</span>
						{item.badge && item.badge > 0 && (
							<Badge variant="secondary" className="h-5 px-1.5 text-xs">
								{item.badge > 99 ? '99+' : item.badge}
							</Badge>
						)}
					</div>
					{hasChildren && (
						<ChevronDown 
							className={cn(
								'h-4 w-4 transition-transform duration-200',
								isExpanded && 'rotate-180'
							)}
						/>
					)}
				</div>

				<AnimatePresence>
					{hasChildren && isExpanded && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className="mt-1 space-y-1"
						>
							{item.children?.map(child => renderNavItem(child, level + 1))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		)
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
						onClick={onClose}
					/>

					{/* Navigation Panel */}
					<motion.div
						initial={{ x: '-100%' }}
						animate={{ x: 0 }}
						exit={{ x: '-100%' }}
						transition={{ type: 'spring', stiffness: 300, damping: 30 }}
						className={cn(
							'fixed left-0 top-0 z-50 h-full w-80 bg-background border-r border-border shadow-lg',
							className
						)}
					>
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b border-border">
							<div className="flex items-center space-x-2">
								<Dumbbell className="h-6 w-6 text-primary" />
								<span className="text-lg font-bold">Kairos</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={onClose}
								className="h-8 w-8 p-0"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* Navigation Items */}
						<nav className="flex-1 space-y-1 p-4 overflow-y-auto">
							{items.map(item => renderNavItem(item))}
						</nav>

						{/* User Section */}
						{user && (
							<div className="border-t border-border p-4">
								<div className="flex items-center space-x-3">
									<Avatar className="h-10 w-10">
										<AvatarImage src={user.avatar} alt={user.name} />
										<AvatarFallback>
											{user.name.split(' ').map(n => n[0]).join('')}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium truncate">{user.name}</div>
										<div className="text-xs text-muted-foreground truncate">{user.email}</div>
									</div>
								</div>
							</div>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}

// Default navigation items
export const defaultNavItems: NavItem[] = [
	{
		id: 'dashboard',
		label: 'Dashboard',
		icon: <Home className="h-4 w-4" />,
		href: '/dashboard'
	},
	{
		id: 'workouts',
		label: 'Workouts',
		icon: <Dumbbell className="h-4 w-4" />,
		href: '/workouts',
		children: [
			{
				id: 'my-workouts',
				label: 'My Workouts',
				icon: <Dumbbell className="h-4 w-4" />,
				href: '/workouts/my'
			},
			{
				id: 'templates',
				label: 'Templates',
				icon: <Dumbbell className="h-4 w-4" />,
				href: '/workouts/templates'
			}
		]
	},
	{
		id: 'analytics',
		label: 'Analytics',
		icon: <TrendingUp className="h-4 w-4" />,
		href: '/analytics'
	},
	{
		id: 'profile',
		label: 'Profile',
		icon: <User className="h-4 w-4" />,
		href: '/profile'
	},
	{
		id: 'settings',
		label: 'Settings',
		icon: <Settings className="h-4 w-4" />,
		href: '/settings'
	}
]