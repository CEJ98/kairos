'use client'

import { logger } from './logger'

// Utilidades para PWA y Service Worker
export class PWAManager {
  private static instance: PWAManager
  private deferredPrompt: any = null
  private isInstalled = false
  private registration: ServiceWorkerRegistration | null = null
  
  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }
  
  // Inicializar PWA
  async initialize() {
    if (typeof window === 'undefined') return
    
    // Registrar Service Worker
    await this.registerServiceWorker()
    
    // Setup installation prompt
    this.setupInstallPrompt()
    
    // Detectar si ya está instalado
    this.detectInstallation()
    
    // Setup notificaciones
    this.setupNotifications()
    
    // Escuchar eventos de conectividad
    this.setupConnectivityListeners()
  }
  
  // Registrar Service Worker
  private async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      logger.info('Service Workers no están soportados', {}, 'PWA')
      return
    }
    
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      logger.info('Service Worker registrado', { registration: this.registration?.scope }, 'PWA')
      
      // Escuchar actualizaciones
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable()
            }
          })
        }
      })
      
      // Controlar actualizaciones
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
      
    } catch (error) {
      logger.error('Error registrando Service Worker', error, 'PWA')
    }
  }
  
  // Setup del prompt de instalación
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir que Chrome muestre el prompt automáticamente
      e.preventDefault()
      this.deferredPrompt = e
      
      // Mostrar botón de instalación personalizado
      this.showInstallButton()
    })
    
    // Detectar cuando se instala
    window.addEventListener('appinstalled', () => {
      logger.info('PWA instalada', {}, 'PWA')
      this.isInstalled = true
      this.hideInstallButton()
      this.trackInstallation()
    })
  }
  
  // Detectar si ya está instalado
  private detectInstallation() {
    // Método 1: Comprobar display mode
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true
      return
    }
    
    // Método 2: Comprobar navigator.standalone (iOS)
    if ((navigator as any).standalone === true) {
      this.isInstalled = true
      return
    }
    
    // Método 3: Comprobar user agent
    if (document.referrer.includes('android-app://')) {
      this.isInstalled = true
      return
    }
  }
  
  // Mostrar prompt de instalación
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      logger.debug('No hay prompt de instalación disponible', {}, 'PWA')
      return false
    }
    
    try {
      // Mostrar prompt
      this.deferredPrompt.prompt()
      
      // Esperar decisión del usuario
      const { outcome } = await this.deferredPrompt.userChoice
      
      logger.info(`Usuario ${outcome} la instalación`, { outcome }, 'PWA')
      
      // Limpiar el prompt
      this.deferredPrompt = null
      
      return outcome === 'accepted'
    } catch (error) {
      logger.error('Error mostrando install prompt', error, 'PWA')
      return false
    }
  }
  
  // Mostrar botón de instalación
  private showInstallButton() {
    const event = new CustomEvent('pwa:installable', {
      detail: { canInstall: true }
    })
    window.dispatchEvent(event)
  }
  
  // Ocultar botón de instalación
  private hideInstallButton() {
    const event = new CustomEvent('pwa:installed', {
      detail: { installed: true }
    })
    window.dispatchEvent(event)
  }
  
  // Mostrar notificación de actualización
  private showUpdateAvailable() {
    const event = new CustomEvent('pwa:update-available', {
      detail: { updateAvailable: true }
    })
    window.dispatchEvent(event)
  }
  
  // Aplicar actualización
  async applyUpdate() {
    if (!this.registration) return
    
    const waitingWorker = this.registration.waiting
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
  }
  
  // Setup de notificaciones
  private async setupNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      logger.info('Notificaciones no soportadas', {}, 'PWA')
      return
    }
    
    // Verificar permisos
    if (Notification.permission === 'default') {
      logger.debug('Permisos de notificación no otorgados aún', {}, 'PWA')
    }
  }
  
  // Solicitar permisos de notificación
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.info('Notificaciones no soportadas', {}, 'PWA')
      return false
    }
    
    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        logger.info('Permisos de notificación otorgados', {}, 'PWA')
        
        // Suscribirse a push notifications
        await this.subscribeToPush()
        
        return true
      }
      
      logger.warn('Permisos de notificación denegados', {}, 'PWA')
      return false
    } catch (error) {
      logger.error('Error solicitando permisos', error, 'PWA')
      return false
    }
  }
  
  // Suscribirse a push notifications
  private async subscribeToPush() {
    if (!this.registration) return
    
    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ) as any
      })
      
      logger.info('Suscripción a push notifications', { endpoint: subscription?.endpoint }, 'PWA')
      
      // Enviar suscripción al servidor
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      })
      
    } catch (error) {
      logger.error('Error suscribiéndose a push', error, 'PWA')
    }
  }
  
  // Utilitaria para convertir VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }
  
  // Mostrar notificación local
  showNotification(title: string, options?: NotificationOptions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      logger.warn('No se pueden mostrar notificaciones', {}, 'PWA')
      return
    }
    
    const defaultOptions: NotificationOptions = {
      body: 'Tienes una nueva notificación de Kairos Fitness',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'kairos-notification',
      requireInteraction: false,
      ...options
    }
    
    new Notification(title, defaultOptions)
  }
  
  // Setup listeners de conectividad
  private setupConnectivityListeners() {
    window.addEventListener('online', () => {
      logger.info('Conexión restaurada', {}, 'PWA')
      this.syncPendingData()
      
      // Notificar a la app
      const event = new CustomEvent('pwa:online', {
        detail: { online: true }
      })
      window.dispatchEvent(event)
    })
    
    window.addEventListener('offline', () => {
      logger.warn('Conexión perdida', {}, 'PWA')
      
      // Notificar a la app
      const event = new CustomEvent('pwa:offline', {
        detail: { online: false }
      })
      window.dispatchEvent(event)
    })
  }
  
  // Sincronizar datos pendientes
  private async syncPendingData() {
    if (!this.registration) return
    
    try {
      await (this.registration as any).sync.register('background-sync')
      logger.info('Background sync registrado', {}, 'PWA')
    } catch (error) {
      logger.error('Error registrando background sync', error, 'PWA')
    }
  }
  
  // Trackear instalación con analytics
  private trackInstallation() {
    // Google Analytics
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installed',
        value: 1
      })
    }
    
    // Evento personalizado
    const event = new CustomEvent('pwa:install-tracked', {
      detail: { 
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    })
    window.dispatchEvent(event)
  }
  
  // Getters
  get canInstall(): boolean {
    return !!this.deferredPrompt
  }
  
  get installed(): boolean {
    return this.isInstalled
  }
  
  get hasNotificationPermission(): boolean {
    return 'Notification' in window && Notification.permission === 'granted'
  }
  
  get isOnline(): boolean {
    return navigator.onLine
  }
}

// Hook para usar PWA en React
export function usePWA() {
  const pwa = PWAManager.getInstance()
  
  return {
    canInstall: pwa.canInstall,
    installed: pwa.installed,
    hasNotificationPermission: pwa.hasNotificationPermission,
    isOnline: pwa.isOnline,
    install: () => pwa.showInstallPrompt(),
    requestNotificationPermission: () => pwa.requestNotificationPermission(),
    showNotification: (title: string, options?: NotificationOptions) => 
      pwa.showNotification(title, options),
    applyUpdate: () => pwa.applyUpdate()
  }
}

// Inicializar PWA automáticamente
if (typeof window !== 'undefined') {
  const pwa = PWAManager.getInstance()
  pwa.initialize()
}