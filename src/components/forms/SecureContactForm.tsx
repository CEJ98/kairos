/**
 * Secure Contact Form Component
 * Formulario de contacto con validación de seguridad avanzada
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, ContactFormData } from '@/lib/validations/contact'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SecureTextField, SecureTextareaField } from '@/components/ui/secure-form-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SecureContactFormProps {
  onSuccess?: () => void
  defaultValues?: Partial<ContactFormData>
  className?: string
}

export function SecureContactForm({
  onSuccess,
  defaultValues,
  className
}: SecureContactFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      phone: '',
      company: '',
      type: 'general',
      newsletter: false,
      ...defaultValues
    },
    mode: 'onChange'
  })

  const handleSubmit = async (data: ContactFormData) => {
    setIsLoading(true)

    try {
      // Simular envío de formulario
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // En una implementación real, aquí enviarías los datos a tu API
      console.log('Form data:', data)
      
      toast.success('Mensaje enviado correctamente. Te contactaremos pronto.')
      form.reset()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error('Error al enviar el mensaje. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Envíanos un mensaje</CardTitle>
        <CardDescription>
          Completa el formulario y nos pondremos en contacto contigo lo antes posible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecureTextField
              control={form.control}
              name="name"
              label="Nombre completo"
              placeholder="Tu nombre"
              required
              securityTip="Usamos tu nombre solo para personalizar nuestra comunicación contigo."
            />
            
            <SecureTextField
              control={form.control}
              name="email"
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              required
              securityTip="Tu correo electrónico está protegido y nunca será compartido con terceros."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecureTextField
              control={form.control}
              name="phone"
              label="Teléfono"
              type="tel"
              placeholder="+52 55 1234 5678"
              securityTip="Opcional. Solo te llamaremos si es necesario para resolver tu consulta."
            />
            
            <SecureTextField
              control={form.control}
              name="company"
              label="Empresa"
              placeholder="Nombre de tu empresa"
              securityTip="Opcional. Nos ayuda a entender mejor tu contexto empresarial."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Tipo de consulta <span className="text-red-500">*</span>
            </Label>
            <Select
              defaultValue={form.getValues('type')}
              onValueChange={(value) => form.setValue('type', value as any, { shouldValidate: true })}
            >
              <SelectTrigger id="type" className={form.formState.errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecciona el tipo de consulta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Consulta general</SelectItem>
                <SelectItem value="support">Soporte técnico</SelectItem>
                <SelectItem value="business">Oportunidad de negocio</SelectItem>
                <SelectItem value="partnership">Alianza estratégica</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.type.message}</p>
            )}
          </div>
          
          <SecureTextField
            control={form.control}
            name="subject"
            label="Asunto"
            placeholder="¿En qué podemos ayudarte?"
            required
            securityTip="Un asunto claro nos ayuda a dirigir tu consulta al equipo adecuado."
          />
          
          <SecureTextareaField
            control={form.control}
            name="message"
            label="Mensaje"
            placeholder="Cuéntanos más sobre tus necesidades, número de usuarios, funcionalidades específicas que requieres, etc."
            rows={5}
            required
            maxLength={2000}
            showCharacterCount
            securityTip="Tu mensaje es confidencial y solo será leído por nuestro equipo de atención al cliente."
          />
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="newsletter"
              checked={form.getValues('newsletter')}
              onCheckedChange={(checked) => {
                form.setValue('newsletter', checked === true, { shouldValidate: true })
              }}
            />
            <Label
              htmlFor="newsletter"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Suscribirme al newsletter con novedades y ofertas
            </Label>
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar Mensaje
                <Send className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}