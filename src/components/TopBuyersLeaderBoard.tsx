// src/components/leaderboard/TopBuyersLeaderboard.tsx

// -----------------------------------------------------------------------------
// 1. IMPORTACIONES
// -----------------------------------------------------------------------------
// Herramientas de base de datos (Drizzle), React, iconos y utilidades.
// -----------------------------------------------------------------------------
import { db } from "@/lib/db";
import { purchases } from "@/lib/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { Diamond, Shield, Star, Medal, Trophy, Gift } from 'lucide-react';
import React, { ReactNode } from 'react';
import clsx from 'clsx';

// -----------------------------------------------------------------------------
// 2. DEFINICIÓN DE TIPOS (TYPES)
// -----------------------------------------------------------------------------
// Estructura de datos para un comprador y su rango.
// -----------------------------------------------------------------------------
type BuyerWithRank = {
    buyerName: string | null;
    buyerEmail: string;
    totalTickets: number;
    rank: Rank;
    rankIndex: number;
};

type Rank = {
    name: string;
    icon: ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
};

// -----------------------------------------------------------------------------
// 3. CONSTANTES Y CONFIGURACIÓN DE RANGOS
// -----------------------------------------------------------------------------
// Array que define cada rango con su nombre, icono y paleta de colores.
// -----------------------------------------------------------------------------
const RANKS: Rank[] = [
    { name: 'Diamante', icon: <Diamond className="h-full w-full" />, color: 'text-cyan-300', bgColor: 'bg-cyan-300', borderColor: 'border-cyan-300', glowColor: 'shadow-cyan-300/60' },
    { name: 'Platino', icon: <Shield className="h-full w-full" />, color: 'text-slate-300', bgColor: 'bg-slate-300', borderColor: 'border-slate-300', glowColor: 'shadow-slate-300/60' },
    { name: 'Oro', icon: <Star className="h-full w-full" />, color: 'text-yellow-400', bgColor: 'bg-yellow-400', borderColor: 'border-yellow-400', glowColor: 'shadow-yellow-400/60' },
    { name: 'Plata', icon: <Medal className="h-full w-full" />, color: 'text-gray-400', bgColor: 'bg-gray-400', borderColor: 'border-gray-400', glowColor: 'shadow-gray-400/60' },
    { name: 'Bronce', icon: <Trophy className="h-full w-full" />, color: 'text-orange-400', bgColor: 'bg-orange-400', borderColor: 'border-orange-400', glowColor: 'shadow-orange-400/60' },
];

const getRankForIndex = (index: number): Rank => RANKS[index] || RANKS[RANKS.length - 1];

// -----------------------------------------------------------------------------
// 4. FUNCIÓN DE OBTENCIÓN DE DATOS (Data Fetching)
// -----------------------------------------------------------------------------
// Función asíncrona que se ejecuta en el servidor para obtener el top 5
// de la base de datos.
// -----------------------------------------------------------------------------
async function getTopBuyers(): Promise<BuyerWithRank[]> {
    try {
        const topBuyersData = await db
            .select({
                buyerName: purchases.buyerName,
                buyerEmail: purchases.buyerEmail,
                totalTickets: sql<number>`sum(${purchases.ticketCount})`.as('total_tickets'),
            })
            .from(purchases)
            .where(eq(purchases.status, 'confirmed'))
            .groupBy(purchases.buyerEmail, purchases.buyerName)
            .orderBy(desc(sql`total_tickets`))
            .limit(5);

        // Mapeamos los resultados para añadirles el rango y formatear los datos.
        return topBuyersData.map((buyer, index) => ({
            ...buyer,
            totalTickets: Number(buyer.totalTickets),
            rankIndex: index,
            rank: getRankForIndex(index),
        }));
    } catch (error) {
        console.error("Error al obtener los mejores compradores:", error);
        return []; // Devolvemos un array vacío si hay un error.
    }
}

// -----------------------------------------------------------------------------
// 5. SUB-COMPONENTES DE UI
// -----------------------------------------------------------------------------
// Pequeños componentes reutilizables para construir el leaderboard.
// -----------------------------------------------------------------------------

// --- Componente de partículas para el 1er puesto ---
const Sparkles = () => (
    <div className="absolute inset-0 z-0">{[...Array(12)].map((_, i) => ( <div key={i} className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-sparkle" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 1.5}s`, animationDuration: `${0.5 + Math.random() * 1}s` }} />))}</div>
);

// --- Componente para la insignia del icono de rango ---
const RankBadge = ({ rank, size = 'h-8 w-8' }: { rank: Rank, size?: string }) => (
    <div className={clsx('relative flex items-center justify-center', size, rank.color)}><div className={clsx('absolute -inset-1.5 opacity-50 blur-lg rounded-full animate-pulse', rank.glowColor)}></div>{rank.icon}</div>
);

// --- Componente para cada puesto en el podio (Top 3) ---
const PodiumItem = ({ buyer, position }: { buyer: BuyerWithRank; position: 1 | 2 | 3 }) => {
    const isFirst = position === 1;
    const styles = { 1: { h: 'h-full', order: 'order-2' }, 2: { h: 'h-[80%]', order: 'order-1' }, 3: { h: 'h-[65%]', order: 'order-3' } };
    return (
        <div className={clsx('relative flex flex-col items-center w-1/3 max-w-[220px]', styles[position].h, styles[position].order)}>
            <RankBadge rank={buyer.rank} size={isFirst ? "h-12 w-12" : "h-10 w-10"} />
            {isFirst && <Sparkles />}
            <div className="text-center mt-2 flex flex-col items-center gap-1 h-14 justify-center">
                <p className="text-sm font-bold text-white px-1 truncate" title={buyer.buyerName || 'Anónimo'}>{buyer.buyerName || 'Anónimo'}</p>
                <div className={clsx("px-2 py-0.5 rounded-full text-xs font-bold border", buyer.rank.borderColor, buyer.rank.color, "bg-black/20")}>{buyer.rank.name}</div>
            </div>
            <p className={clsx("text-xl sm:text-2xl font-black font-display mt-1", buyer.rank.color)}>{buyer.totalTickets}</p>
            <div className={clsx("mt-auto w-full h-full rounded-t-lg bg-white/5 border-t-4 flex items-center justify-center", buyer.rank.borderColor)}>
                <span className={`text-5xl sm:text-6xl font-black font-display opacity-20 ${buyer.rank.color}`}>{position}</span>
            </div>
        </div>
    );
};

// --- Componente para cada fila de la lista (Puestos 4-5) ---
const LeaderboardRow = ({ buyer, maxTickets }: { buyer: BuyerWithRank, maxTickets: number }) => {
    const progress = (buyer.totalTickets / maxTickets) * 100;
    return (
        <div className="flex items-center p-1.5 gap-2 rounded-lg bg-white/[.03] border border-white/5">
            <div className="flex-shrink-0 w-5 text-center font-bold text-sm font-display text-white/40">{buyer.rankIndex + 1}</div>
            <div className="flex-shrink-0"><RankBadge rank={buyer.rank} size="h-6 w-6"/></div>
            <div className="flex-grow min-w-0">
                <p className="font-bold text-white text-xs truncate">{buyer.buyerName || 'Anónimo'}</p>
                <div className="w-full bg-white/10 rounded-full h-1 mt-1"><div className={clsx("h-1 rounded-full", buyer.rank.bgColor)} style={{ width: `${progress}%` }}></div></div>
            </div>
            <div className="text-right flex-shrink-0"><p className="text-base font-bold font-display text-white">{buyer.totalTickets}</p></div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// 6. COMPONENTE PRINCIPAL EXPORTADO
// -----------------------------------------------------------------------------
// Este es el componente de servidor que se importa en la página principal.
// Une todas las piezas anteriores para renderizar el leaderboard completo.
// -----------------------------------------------------------------------------
export async function TopBuyersLeaderboard() {
    const topBuyers = await getTopBuyers();

    // --- Vista por defecto si no hay compradores ---
    if (topBuyers.length === 0) {
        return (
            <div className="p-6 text-center h-full flex flex-col justify-center">
                <h3 className="font-bold text-white text-xl">Top Compradores</h3>
                <p className="text-sm text-zinc-400 mt-2">¡La tabla de clasificación aparecerá aquí cuando comience el juego!</p>
            </div>
        );
    }

    const podiumBuyers = topBuyers.slice(0, 3);
    const otherBuyers = topBuyers.slice(3);
    const maxTickets = topBuyers[0]?.totalTickets || 1;
    
    // --- Vista principal con la tabla de clasificación ---
    return (
        <div className="w-full h-full flex flex-col">
            
            {/* MENSAJE DEL PREMIO - VISIBLE SOLO EN MÓVIL (oculto en lg y superior) */}
            <div className="lg:hidden mb-6 p-4 bg-amber-950/40 border border-amber-500/30 rounded-lg text-center">
                <Gift className="h-8 w-8 mx-auto text-amber-400 mb-2"/>
                <p className="text-amber-300 font-bold text-base">
                    ¡Gana $1000!
                </p>
                <p className="text-white/80 text-sm mt-1">
                    Mantente en el Top 1 hasta el 5 de Octubre que termina la rifa.
                </p>
            </div>

            {/* --- Podio (Top 3) --- */}
            <div className="flex-shrink-0">
                {podiumBuyers.length > 0 && (
                    <div className="flex justify-center items-end gap-2 mb-12 h-[220px] animate-fade-in-up">
                        {podiumBuyers[1] && <PodiumItem buyer={podiumBuyers[1]} position={2} />}
                        {podiumBuyers[0] && <PodiumItem buyer={podiumBuyers[0]} position={1} />}
                        {podiumBuyers[2] && <PodiumItem buyer={podiumBuyers[2]} position={3} />}
                    </div>
                )}
            </div>
            
            {/* --- Lista (Puestos 4 y 5) --- */}
            <div className="flex-grow overflow-y-auto">
                {otherBuyers.length > 0 && (
                    <div className="space-y-4">
                        {otherBuyers.map(b => <LeaderboardRow key={b.buyerEmail} buyer={b} maxTickets={maxTickets} />)}
                    </div>
                )}
            </div>
        </div>
    );
}