// src/components/leaderboard/TopBuyersLeaderboard.tsx

// -----------------------------------------------------------------------------
// 1. IMPORTACIONES (Sin cambios)
// -----------------------------------------------------------------------------
import { db } from "@/lib/db";
import { purchases } from "@/lib/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { Diamond, Shield, Star, Medal, Trophy, Gift } from 'lucide-react';
import React, { ReactNode } from 'react';
import clsx from 'clsx';

// -----------------------------------------------------------------------------
// 2. TIPOS Y CONSTANTES (Sin cambios)
// -----------------------------------------------------------------------------
type BuyerWithRank = {
    buyerName: string | null;
    buyerEmail: string;
    totalTickets: number;
    rank: Rank;
    rankIndex: number;
};
type Rank = { name: string; icon: ReactNode; color: string; bgColor: string; borderColor: string; glowColor: string; };

const RANKS: Rank[] = [
    { name: 'Diamante', icon: <Diamond className="h-full w-full" />, color: 'text-cyan-300', bgColor: 'bg-cyan-300', borderColor: 'border-cyan-300', glowColor: 'shadow-cyan-300/60' },
    { name: 'Platino', icon: <Shield className="h-full w-full" />, color: 'text-slate-300', bgColor: 'bg-slate-300', borderColor: 'border-slate-300', glowColor: 'shadow-slate-300/60' },
    { name: 'Oro', icon: <Star className="h-full w-full" />, color: 'text-yellow-400', bgColor: 'bg-yellow-400', borderColor: 'border-yellow-400', glowColor: 'shadow-yellow-400/60' },
    { name: 'Plata', icon: <Medal className="h-full w-full" />, color: 'text-gray-400', bgColor: 'bg-gray-400', borderColor: 'border-gray-400', glowColor: 'shadow-gray-400/60' },
    { name: 'Bronce', icon: <Trophy className="h-full w-full" />, color: 'text-orange-400', bgColor: 'bg-orange-400', borderColor: 'border-orange-400', glowColor: 'shadow-orange-400/60' },
];
const getRankForIndex = (index: number): Rank => RANKS[index] || RANKS[RANKS.length - 1];

// -----------------------------------------------------------------------------
// 4. OBTENCIÓN DE DATOS (Sin cambios)
// -----------------------------------------------------------------------------
async function getTopBuyers(): Promise<BuyerWithRank[]> {
    try {
        const topBuyersData = await db.select({
            buyerName: purchases.buyerName,
            buyerEmail: purchases.buyerEmail,
            totalTickets: sql<number>`sum(${purchases.ticketCount})`.as('total_tickets'),
        }).from(purchases)
            .where(eq(purchases.status, 'confirmed'))
            .groupBy(purchases.buyerEmail, purchases.buyerName)
            .orderBy(desc(sql`total_tickets`))
            .limit(5);

        return topBuyersData.map((buyer, index) => ({
            ...buyer,
            totalTickets: Number(buyer.totalTickets),
            rankIndex: index,
            rank: getRankForIndex(index),
        }));
    } catch (error) {
        console.error("Error al obtener los mejores compradores:", error);
        return [];
    }
}

// -----------------------------------------------------------------------------
// 5. SUB-COMPONENTES DE UI (REFACTORIZADOS)
// -----------------------------------------------------------------------------

// Componente para las chispas del primer lugar (sin cambios funcionales)
const Sparkles = () => (
    <div className="absolute inset-0 z-0">{[...Array(12)].map((_, i) => ( <div key={i} className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-sparkle" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 1.5}s`, animationDuration: `${0.5 + Math.random() * 1}s` }} />))}</div>
);

// Componente para la insignia de rango (sin cambios funcionales)
const RankBadge = ({ rank, size = 'h-8 w-8' }: { rank: Rank, size?: string }) => (
    <div className={clsx('relative flex-shrink-0 flex items-center justify-center', size, rank.color)}>
        <div className={clsx('absolute -inset-1 opacity-60 blur-md rounded-full animate-pulse', rank.glowColor)}></div>
        {rank.icon}
    </div>
);

// --- [REFACTORIZADO] --- Componente para cada puesto del podio
const PodiumItem = ({ buyer, position }: { buyer: BuyerWithRank; position: 1 | 2 | 3 }) => {
    const isFirst = position === 1;
    
    // Alturas y orden para el podio. Se mantienen para la jerarquía visual.
    const styles = {
        1: { height: 'h-full', order: 'order-2' },
        2: { height: 'h-[85%]', order: 'order-1' },
        3: { height: 'h-[70%]', order: 'order-3' },
    };

    return (
        // CAMBIO: Se usa 'flex-1' para que cada item ocupe el espacio disponible de forma flexible
        // en lugar de 'w-1/3', lo que evita desbordamientos en pantallas pequeñas.
        <div className={clsx('relative flex flex-col items-center flex-1 max-w-[180px]', styles[position].height, styles[position].order)}>
            <div className="flex flex-col items-center text-center px-1">
                {isFirst && <Sparkles />}
                {/* CAMBIO: Tamaños de insignia ajustados para ser más compactos en móvil. */}
                <RankBadge rank={buyer.rank} size={isFirst ? "h-10 w-10 sm:h-12 sm:w-12" : "h-8 w-8 sm:h-10 sm:w-10"} />
                
                {/* CAMBIO: Se reduce el margen y se ajusta el alto mínimo para el nombre. */}
                <div className="mt-1.5 min-h-[36px] sm:min-h-[40px] flex flex-col items-center justify-start gap-0.5">
                    {/* CAMBIO: Se ajusta el tamaño de la fuente y se usa 'w-full' para truncar correctamente. */}
                    <p className="text-xs sm:text-sm font-bold text-white w-full truncate" title={buyer.buyerName || 'Anónimo'}>
                        {buyer.buyerName || 'Anónimo'}
                    </p>
                    <div className={clsx("px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border", buyer.rank.borderColor, buyer.rank.color, "bg-black/20")}>
                        {buyer.rank.name}
                    </div>
                </div>
            </div>

            {/* CAMBIO: Se simplifica la estructura. 'flex-grow' empuja el número hacia abajo. */}
            <div className={clsx(
                "w-full flex-grow flex flex-col justify-end mt-1 rounded-t-lg border-t-4",
                "bg-gradient-to-b from-white/10 to-transparent", // MEJORA VISUAL: Gradiente sutil.
                buyer.rank.borderColor
            )}>
                <p className={clsx("text-lg sm:text-2xl font-black text-center font-display", buyer.rank.color)}>
                    {buyer.totalTickets}
                </p>
                <div className="w-full text-center py-1">
                    <span className={clsx("text-3xl sm:text-5xl font-black font-display opacity-20", buyer.rank.color)}>
                        {position}
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- [REFACTORIZADO] --- Componente para las filas de la tabla
const LeaderboardRow = ({ buyer, maxTickets }: { buyer: BuyerWithRank, maxTickets: number }) => {
    const progress = Math.min((buyer.totalTickets / maxTickets) * 100, 100);
    return (
        // CAMBIO: Espaciado (gap) ajustado. Se añade efecto hover.
        <div className="flex items-center p-2 gap-3 rounded-lg bg-white/[.03] border border-white/5 hover:bg-white/5 transition-colors duration-200">
            {/* CAMBIO: Se reduce el tamaño del número de ranking para dar más espacio al nombre. */}
            <div className="w-4 text-center font-bold text-xs font-display text-white/40">{buyer.rankIndex + 1}</div>
            <RankBadge rank={buyer.rank} size="h-6 w-6"/>
            
            {/* CAMBIO: Se agrupan nombre y barra de progreso para un mejor control del truncado. */}
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-white text-sm truncate">{buyer.buyerName || 'Anónimo'}</p>
                <div className="w-full bg-black/20 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div className={clsx("h-1.5 rounded-full", buyer.rank.bgColor)} style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            
            <div className="text-right flex-shrink-0">
                <p className="text-base font-bold font-display text-white">{buyer.totalTickets}</p>
            </div>
        </div>
    );
};


// -----------------------------------------------------------------------------
// 6. COMPONENTE PRINCIPAL (REFACTORIZADO)
// -----------------------------------------------------------------------------
export async function TopBuyersLeaderboard() {
    const topBuyers = await getTopBuyers();

    if (topBuyers.length === 0) {
        return (
            <div className="p-6 text-center border border-dashed border-zinc-700 rounded-lg">
                <Trophy className="h-10 w-10 mx-auto text-zinc-500 mb-3"/>
                <h3 className="font-bold text-white text-xl">Top Compradores</h3>
                <p className="text-sm text-zinc-400 mt-1">¡La tabla de clasificación aparecerá aquí cuando haya compras!</p>
            </div>
        );
    }

    const podiumBuyers = topBuyers.slice(0, 3);
    const otherBuyers = topBuyers.slice(3);
    const maxTickets = topBuyers[0]?.totalTickets || 1;
    
    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* MEJORA VISUAL: Título principal del componente */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">
                Tabla de Líderes
            </h2>
            <p className="text-sm text-center text-zinc-400 mb-6">Los 5 compradores con más tickets.</p>

            {/* MEJORA VISUAL: Banner de premio rediseñado para ser más atractivo. */}
            <div className="mb-8 p-4 bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-lg text-center flex items-center justify-center gap-4">
                <div className="flex-shrink-0 bg-amber-400/10 p-2.5 rounded-full border border-amber-400/20">
                    <Gift className="h-7 w-7 text-amber-400"/>
                </div>
                <div>
                    <p className="text-amber-300 font-bold text-base">¡El Top 1 gana $1000!</p>
                    <p className="text-white/80 text-xs sm:text-sm mt-0.5">Mantente en la cima hasta el 5 de Octubre.</p>
                </div>
            </div>

            {podiumBuyers.length > 0 && (
                // CAMBIO: Se ajusta altura mínima y espaciado del podio.
                <div className="flex justify-center items-end gap-1 sm:gap-2 mb-8 min-h-[220px] sm:min-h-[250px] animate-fade-in-up">
                    {podiumBuyers[1] && <PodiumItem buyer={podiumBuyers[1]} position={2} />}
                    {podiumBuyers[0] && <PodiumItem buyer={podiumBuyers[0]} position={1} />}
                    {podiumBuyers[2] && <PodiumItem buyer={podiumBuyers[2]} position={3} />}
                </div>
            )}
            
            {otherBuyers.length > 0 && (
                // CAMBIO: Espaciado ajustado para una lista más limpia.
                <div className="space-y-2">
                    {otherBuyers.map(b => <LeaderboardRow key={b.buyerEmail} buyer={b} maxTickets={maxTickets} />)}
                </div>
            )}
        </div>
    );
}