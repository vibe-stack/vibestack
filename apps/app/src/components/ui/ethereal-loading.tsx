import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

function DreamBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Greenish glowing particles
    class GlowingParticle {
      x: number; y: number; radius: number; color: string; vx: number; vy: number; lifespan: number; maxLifespan: number; hue: number;
      constructor() {
        const canvasWidth = canvas?.width || window.innerWidth
        const canvasHeight = canvas?.height || window.innerHeight
        this.x = Math.random() * canvasWidth
        this.y = Math.random() * canvasHeight
        this.radius = 0.5 + Math.random() * 2
        // Green/teal range
        this.hue = Math.random() > 0.7 ? 160 + Math.random() * 30 : 140 + Math.random() * 40
        const saturation = 60 + Math.random() * 30
        const lightness = 30 + Math.random() * 30
        this.color = `hsla(${this.hue}, ${saturation}%, ${lightness}%, 0.8)`
        // Make particles move faster: increase velocity range
        this.vx = -0.6 + Math.random() * 1.2 // was -0.2 + Math.random() * 0.4
        this.vy = -0.6 + Math.random() * 1.2 // was -0.2 + Math.random() * 0.4
        this.maxLifespan = 200 + Math.random() * 200
        this.lifespan = Math.random() * this.maxLifespan
      }
      draw() {
        if (!ctx) return
        const opacity = this.lifespan < this.maxLifespan * 0.2 ? this.lifespan / (this.maxLifespan * 0.2) : this.lifespan > this.maxLifespan * 0.8 ? (this.maxLifespan - this.lifespan) / (this.maxLifespan * 0.2) : 1
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 8)
        const colorMatch = this.color.match(/hsla\((\d+),\s*(\d+)%?,\s*(\d+)%?,\s*([\d.]+)\)/)
        if (colorMatch) {
          const [, h, s, l] = colorMatch
          glow.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${opacity * 0.8})`)
          glow.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, ${opacity * 0.4})`)
          glow.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`)
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(this.x, this.y, this.radius * 8, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = `hsla(${h}, ${s}%, ${parseInt(l) + 20}%, ${opacity})`
          ctx.beginPath()
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        this.lifespan--
        const canvasWidth = canvas?.width || window.innerWidth
        const canvasHeight = canvas?.height || window.innerHeight
        if (this.lifespan <= 0 || this.x < -50 || this.x > canvasWidth + 50 || this.y < -50 || this.y > canvasHeight + 50) {
          this.x = Math.random() * canvasWidth
          this.y = Math.random() * canvasHeight
          this.lifespan = this.maxLifespan
          this.hue = Math.random() > 0.7 ? 160 + Math.random() * 30 : 140 + Math.random() * 40
          const saturation = 60 + Math.random() * 30
          const lightness = 30 + Math.random() * 30
          this.color = `hsla(${this.hue}, ${saturation}%, ${lightness}%, 0.8)`
        }
      }
    }

    // Ethereal green mist
    class EtherealMist {
      x: number; y: number; width: number; height: number; vx: number; opacity: number; color: string;
      constructor() {
        const canvasWidth = canvas?.width || window.innerWidth
        const canvasHeight = canvas?.height || window.innerHeight
        this.width = 200 + Math.random() * 300
        this.height = 100 + Math.random() * 200
        this.x = Math.random() * (canvasWidth + 400) - 200
        this.y = Math.random() * canvasHeight
        this.vx = -0.1 + Math.random() * 0.2
        this.opacity = 0.03 + Math.random() * 0.06
        // Green/teal mist
        const colorChoices = [
          `hsla(160, 60%, 10%, ${this.opacity})`,
          `hsla(140, 50%, 12%, ${this.opacity})`,
          `hsla(170, 40%, 15%, ${this.opacity})`,
          `hsla(150, 60%, 8%, ${this.opacity})`,
        ]
        this.color = colorChoices[Math.floor(Math.random() * colorChoices.length)]
      }
      draw() {
        if (!ctx) return
        ctx.save()
        const gradient = ctx.createRadialGradient(
          this.x + this.width/2, this.y + this.height/2, 0,
          this.x + this.width/2, this.y + this.height/2, Math.max(this.width, this.height)/1.5
        )
        gradient.addColorStop(0, this.color)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.ellipse(
          this.x + this.width/2, 
          this.y + this.height/2, 
          this.width/2, 
          this.height/2, 
          0, 0, Math.PI * 2
        )
        ctx.fill()
        ctx.restore()
      }
      update() {
        const canvasWidth = canvas?.width || window.innerWidth
        this.x += this.vx
        const buffer = this.width
        if (this.vx > 0 && this.x > canvasWidth + buffer) {
          this.x = -this.width - buffer
        } else if (this.vx < 0 && this.x + this.width < -buffer) {
          this.x = canvasWidth + buffer
        }
      }
    }

    // Wisps in green/teal
    class EnergyWisp {
      points: {x: number, y: number}[]; color: string; width: number; length: number; speed: number; curve: number; phase: number; amplitude: number;
      constructor() {
        const canvasWidth = canvas?.width || window.innerWidth
        const canvasHeight = canvas?.height || window.innerHeight
        const startX = Math.random() * canvasWidth
        const startY = Math.random() * canvasHeight
        this.points = []
        this.length = 50 + Math.random() * 150
        this.width = 1 + Math.random() * 3
        for (let i = 0; i < this.length; i++) {
          this.points.push({ x: startX, y: startY })
        }
        // Make wisps move faster: increase speed
        this.speed = 2.0 + Math.random() * 2.0 // was 0.8 + Math.random() * 1.2
        this.curve = Math.random() * 0.2 - 0.1
        this.phase = Math.random() * Math.PI * 2
        this.amplitude = 0.5 + Math.random() * 1.5
        // Green/teal
        const hue = Math.random() > 0.6 ? 160 + Math.random() * 30 : 140 + Math.random() * 40
        const saturation = 60 + Math.random() * 30
        const lightness = 30 + Math.random() * 40
        this.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
      }
      draw() {
        if (!ctx) return
        ctx.save()
        const gradient = ctx.createLinearGradient(
          this.points[0].x, this.points[0].y,
          this.points[this.points.length-1].x, this.points[this.points.length-1].y
        )
        gradient.addColorStop(0, 'rgba(0,0,0,0)')
        gradient.addColorStop(0.2, this.color)
        gradient.addColorStop(0.8, this.color)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.moveTo(this.points[0].x, this.points[0].y)
        for (let i = 1; i < this.points.length - 2; i++) {
          const xc = (this.points[i].x + this.points[i + 1].x) / 2
          const yc = (this.points[i].y + this.points[i + 1].y) / 2
          ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc)
        }
        if (this.points.length > 2) {
          const lastIndex = this.points.length - 1
          ctx.quadraticCurveTo(
            this.points[lastIndex-1].x, 
            this.points[lastIndex-1].y, 
            this.points[lastIndex].x, 
            this.points[lastIndex].y
          )
        }
        ctx.strokeStyle = gradient
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
        ctx.shadowColor = this.color
        ctx.shadowBlur = 10
        ctx.stroke()
        ctx.restore()
      }
      update() {
        const canvasWidth = canvas?.width || window.innerWidth
        const canvasHeight = canvas?.height || window.innerHeight
        for (let i = this.points.length - 1; i > 0; i--) {
          this.points[i].x = this.points[i-1].x
          this.points[i].y = this.points[i-1].y
        }
        this.phase += 0.03
        this.curve += (Math.random() * 0.04 - 0.02)
        this.curve = Math.max(-0.15, Math.min(0.15, this.curve))
        const head = this.points[0]
        head.x += this.speed
        head.y += Math.sin(this.phase) * this.amplitude + this.curve
        if (head.x > canvasWidth + 100) {
          const newY = Math.random() * canvasHeight
          for (const point of this.points) {
            point.x = -20
            point.y = newY
          }
          this.curve = Math.random() * 0.2 - 0.1
          this.phase = Math.random() * Math.PI * 2
          this.amplitude = 0.5 + Math.random() * 1.5
          const hue = Math.random() > 0.6 ? 160 + Math.random() * 30 : 140 + Math.random() * 40
          const saturation = 60 + Math.random() * 30
          const lightness = 30 + Math.random() * 40
          this.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
        }
      }
    }

    const particles: GlowingParticle[] = []
    const mistLayers: EtherealMist[] = []
    const wisps: EnergyWisp[] = []
    // Many more particles: increase counts
    for (let i = 0; i < 600; i++) particles.push(new GlowingParticle()) // was 150
    for (let i = 0; i < 25; i++) mistLayers.push(new EtherealMist()) // was 15
    for (let i = 0; i < 20; i++) wisps.push(new EnergyWisp()) // was 8

    let animationFrameId: number
    const render = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Greenish dark gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#0a1a12')
      gradient.addColorStop(0.5, '#0b2a14')
      gradient.addColorStop(0.8, '#0a2a12')
      gradient.addColorStop(1, '#082a18')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      mistLayers.forEach(mist => { mist.draw(); mist.update() })
      wisps.forEach(wisp => { wisp.draw(); wisp.update() })
      particles.forEach(particle => { particle.draw(); particle.update() })
      animationFrameId = requestAnimationFrame(render)
    }
    render()
    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full absolute inset-0 block bg-slate-900"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0
      }} 
    />
  )
}

export default function EtherealLoading({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-screen w-screen flex items-center justify-center overflow-hidden", className)}>
      <DreamBackground />
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-4 animate-pulse">
          Your dream is loading...
        </span>
        <motion.div
          className="flex space-x-2 mt-2"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="w-3 h-3 bg-white/80 rounded-full" />
          <span className="w-3 h-3 bg-white/60 rounded-full" />
          <span className="w-3 h-3 bg-white/40 rounded-full" />
        </motion.div>
      </div>
    </div>
  )
} 