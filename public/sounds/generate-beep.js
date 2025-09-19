// Script para generar un beep simple usando Web Audio API
// Este archivo se puede ejecutar en el navegador para generar el sonido

function generateBeep() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = 800 // Hz
  oscillator.type = 'sine'
  
  gainNode.gain.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.2)
}

// Para usar en el componente React:
// const playBeep = () => generateBeep()

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateBeep }
}