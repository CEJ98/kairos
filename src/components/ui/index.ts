/**
 * Barrel exports for UI components
 * Centralizes component imports and reduces duplication
 */

// Form components
export { Button } from './button'
export { Input } from './input'
export { Textarea } from './textarea'
export { Label } from './label'
export { Checkbox } from './checkbox'
export { Switch } from './switch'
export { 
	Select, 
	SelectContent, 
	SelectItem, 
	SelectTrigger, 
	SelectValue 
} from './select'

// Layout components
export { 
	Card, 
	CardContent, 
	CardDescription, 
	CardFooter, 
	CardHeader, 
	CardTitle 
} from './card'
export { Separator } from './separator'
export { ScrollArea } from './scroll-area'

// Navigation components
export { 
	Tabs, 
	TabsContent, 
	TabsList, 
	TabsTrigger 
} from './tabs'

// Feedback components
export { Badge } from './badge'
export { Progress } from './progress'
export { Alert, AlertDescription, AlertTitle } from './alert'
export { 
	Tooltip, 
	TooltipContent, 
	TooltipProvider, 
	TooltipTrigger 
} from './tooltip'

// Overlay components
export { 
	Dialog, 
	DialogContent, 
	DialogDescription, 
	DialogFooter, 
	DialogHeader, 
	DialogTitle, 
	DialogTrigger 
} from './dialog'
export { 
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from './dropdown-menu'
export { 
	Popover, 
	PopoverContent, 
	PopoverTrigger 
} from './popover'

// Data display components
export { Avatar, AvatarFallback, AvatarImage } from './avatar'

// Custom components
export { SmartImage } from './smart-image'
// Nota: exportaciones condicionales a módulos inexistentes eliminadas para evitar errores de compilación
export * from './ux-enhancements'

// Utility functions
export { cn } from '@/lib/utils'
