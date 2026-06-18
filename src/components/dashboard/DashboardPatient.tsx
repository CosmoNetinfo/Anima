'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Smile, Calendar, Heart, ShieldAlert } from 'lucide-react'

export function DashboardPatient() {
  return (
    <div className="space-y-6 text-warm-foreground">
      {/* Saluto Grande */}
      <div className="bg-gradient-to-r from-warm to-amber-600 p-6 rounded-2xl shadow-lg text-white space-y-2">
        <h2 className="text-3xl font-bold">Ciao!</h2>
        <p className="text-lg opacity-90">Oggi è una bellissima giornata per prendersi cura di sé.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Come ti senti */}
        <Card className="border-2 border-warm/20 shadow-md">
          <CardHeader className="flex flex-row items-center gap-3">
            <Smile className="h-8 w-8 text-warm" />
            <CardTitle className="text-xl">Come ti senti oggi?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">Fai sapere ai tuoi cari e ai medici come ti senti.</p>
            <div className="grid grid-cols-5 gap-2">
              {['😊', '😐', '😢', '😰', '😕'].map((emoji, index) => (
                <button
                  key={index}
                  className="text-4xl p-3 bg-warm-light hover:bg-warm/20 rounded-xl transition-all active:scale-95"
                  aria-label={`Umore ${index}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ricordi recenti */}
        <Card className="border-2 border-warm/20 shadow-md">
          <CardHeader className="flex flex-row items-center gap-3">
            <Heart className="h-8 w-8 text-danger" />
            <CardTitle className="text-xl">I tuoi ricordi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Guarda i ricordi condivisi con la tua famiglia.</p>
            <button className="mt-4 w-full bg-warm text-white font-semibold py-3 rounded-xl hover:bg-warm/95 transition-all">
              Apri Bacheca Ricordi
            </button>
          </CardContent>
        </Card>
      </div>

      {/* SOS Button */}
      <button className="fixed bottom-6 right-6 h-16 w-16 bg-danger hover:bg-danger/90 text-white rounded-full flex flex-col items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 z-50 animate-pulse">
        <ShieldAlert className="h-6 w-6" />
        <span className="text-[10px] font-bold uppercase mt-0.5">SOS</span>
      </button>
    </div>
  )
}
