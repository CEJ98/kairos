import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, TrendingUp, Calendar, ArrowRight } from "lucide-react";

export function DemoScreen() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              <CardTitle>Próximo Entrenamiento</CardTitle>
            </div>
            <CardDescription>Hoy, 18:00</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold">Empuje Superior A</h4>
              <p className="text-sm text-muted-foreground">Press Banca, Press Militar, Fondos</p>
            </div>
            <Button className="w-full">
              Comenzar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Progreso</CardTitle>
            </div>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Peso corporal</span>
                <span className="font-semibold">75.2 kg</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Volumen</span>
                <span className="font-semibold">+2.1k kg</span>
              </div>
            </div>
            <Button variant="outline" className="mt-3 w-full">Ver detalles</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Semana</CardTitle>
            </div>
            <CardDescription>Plan de entrenamiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { day: "Lun", title: "Piernas", status: "✓" },
              { day: "Mié", title: "Empuje", status: "✓" },
              { day: "Vie", title: "Tracción", status: "Hoy" }
            ].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="secondary" className="w-12">{w.day}</Badge>
                <span className="text-sm">{w.title}</span>
                <Badge variant={w.status === "Hoy" ? "outline" : "default"} className="ml-auto">{w.status}</Badge>
              </div>
            ))}
            <Button variant="outline" className="mt-3 w-full">Ver calendario</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}