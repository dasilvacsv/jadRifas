// app/top-compradores/page.tsx

import { db } from "@/lib/db";
import { purchases } from "@/lib/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { Crown, Diamond, Medal, Shield, Star, Trophy } from 'lucide-react';
import React, { ReactNode } from 'react';
import clsx from 'clsx';

// --- TIPOS Y CONFIGURACIÓN DE RANGOS (Sin cambios) ---
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

const RANKS: Rank[] = [
    { name: 'Leyenda', icon: <Crown className="h-full w-full" />, color: 'text-yellow-300', bgColor: 'bg-yellow-300', borderColor: 'border-yellow-300', glowColor: 'shadow-yellow-300/60' },
    { name: 'Mítico', icon: <Medal className="h-full w-full" />, color: 'text-slate-300', bgColor: 'bg-slate-300', borderColor: 'border-slate-300', glowColor: 'shadow-slate-300/60' },
    { name: 'Bronce', icon: <Trophy className="h-full w-full" />, color: 'text-orange-400', bgColor: 'bg-orange-400', borderColor: 'border-orange-400', glowColor: 'shadow-orange-400/60' },
    { name: 'Diamante', icon: <Diamond className="h-full w-full" />, color: 'text-cyan-300', bgColor: 'bg-cyan-300', borderColor: 'border-cyan-300', glowColor: 'shadow-cyan-300/50' },
    { name: 'Platino', icon: <Shield className="h-full w-full" />, color: 'text-indigo-300', bgColor: 'bg-indigo-300', borderColor: 'border-indigo-300', glowColor: 'shadow-indigo-300/50' },
];

const getRankForIndex = (index: number): Rank => {
    if (index === 0) return RANKS[0]; // Leyenda
    if (index === 1) return RANKS[1]; // Mítico
    if (index === 2) return RANKS[2]; // Bronce
    if (index < 7) return RANKS[3];   // Diamante
    return RANKS[4];                  // Platino
};


// --- FUNCIÓN PARA OBTENER DATOS DEL SERVIDOR ---
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
            .limit(5); // ✅ CAMBIO: Límite ajustado a 5

        return topBuyersData.map((buyer, index) => ({
            ...buyer,
            totalTickets: Number(buyer.totalTickets),
            rankIndex: index,
            rank: getRankForIndex(index),
        }));
    } catch (error) {
        console.error("Error fetching top buyers:", error);
        return [];
    }
}

// --- COMPONENTES AUXILIARES DE LA UI (Sin cambios) ---

const Sparkles = () => (
    <div className="absolute inset-0 z-0">
        {[...Array(12)].map((_, i) => (
            <div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 1.5}s`,
                    animationDuration: `${0.5 + Math.random() * 1}s`
                }}
            />
        ))}
    </div>
);

const RankBadge = ({ rank, size = 'h-10 w-10' }: { rank: Rank, size?: string }) => (
    <div className={clsx('relative flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]', size, rank.color)}>
        <div className={clsx('absolute -inset-1.5 opacity-50 blur-lg rounded-full animate-pulse', rank.glowColor)}></div>
        <div className={clsx('absolute -inset-1 opacity-30 blur-sm rounded-full animate-pulse', rank.glowColor)}></div>
        {rank.icon}
    </div>
);

const LeaderboardRow = ({ buyer, maxTickets }: { buyer: BuyerWithRank, maxTickets: number }) => {
    const progressPercentage = (buyer.totalTickets / maxTickets) * 100;

    return (
        <div
            className={clsx(
                "group relative flex items-center p-3 sm:p-4 gap-4 rounded-xl border bg-gray-900/50 backdrop-blur-sm transition-all duration-300 overflow-hidden",
                "border-white/10 hover:border-white/20 hover:bg-gray-900/70 hover:scale-[1.02] animate-fade-in-up"
            )}
            style={{ animationDelay: `${buyer.rankIndex * 40}ms` }}
        >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer -translate-x-full"></div>
            <div className={clsx("absolute left-0 top-0 h-full w-1", buyer.rank.bgColor)}></div>
            <div className="flex-shrink-0 w-8 sm:w-10 text-center font-bold text-2xl font-display text-white/40">{buyer.rankIndex + 1}</div>
            <div className="flex-shrink-0">
                <RankBadge rank={buyer.rank} />
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-bold text-white text-base sm:text-lg truncate">{buyer.buyerName || 'Comprador Anónimo'}</p>
                <div className="flex items-center gap-2">
                    <p className={clsx("text-sm font-semibold", buyer.rank.color)}>{buyer.rank.name}</p>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                        <div className={clsx("h-1.5 rounded-full", buyer.rank.bgColor)} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
                <p className="text-2xl sm:text-3xl font-bold font-display text-white">{buyer.totalTickets}</p>
                <p className="text-xs text-white/50 tracking-widest uppercase">Tickets</p>
            </div>
        </div>
    );
};

const PodiumItem = ({ buyer, position }: { buyer: BuyerWithRank; position: 1 | 2 | 3 }) => {
    const isFirst = position === 1;
    const styles = {
        1: { height: 'h-full', order: 'order-2', borderColor: 'border-yellow-300', textColor: 'text-yellow-300' },
        2: { height: 'h-[80%]', order: 'order-1', borderColor: 'border-slate-300', textColor: 'text-slate-300' },
        3: { height: 'h-[65%]', order: 'order-3', borderColor: 'border-orange-400', textColor: 'text-orange-400' },
    };

    return (
        <div className={clsx('relative flex flex-col items-center w-1/3 max-w-[220px]', styles[position].height, styles[position].order)}>
            <div className="transition-transform duration-500 group-hover:-translate-y-4">
                <RankBadge rank={buyer.rank} size={isFirst ? "h-20 w-20" : "h-16 w-16"} />
                {isFirst && <Sparkles />}
            </div>
            <div className="text-center mt-3">
                 <p className="text-lg sm:text-2xl font-bold text-white px-2 truncate" title={buyer.buyerName || 'Anónimo'}>
                    {buyer.buyerName || 'Anónimo'}
                </p>
            </div>
            <p className={clsx("text-4xl sm:text-6xl font-black font-display mt-1 drop-shadow-lg", styles[position].textColor)}>
                {buyer.totalTickets}
            </p>
            <div className={clsx(
                "mt-4 w-full h-full rounded-t-xl bg-gradient-to-b from-white/10 to-transparent border-t-4 flex items-center justify-center",
                styles[position].borderColor
            )}>
                 <span className={`text-8xl sm:text-9xl font-black font-display opacity-20 ${styles[position].textColor}`}>{position}</span>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default async function TopCompradoresPage() {
    const topBuyers = await getTopBuyers();

    const podiumBuyers = topBuyers.slice(0, 3);
    const otherBuyers = topBuyers.slice(3);
    const maxTickets = topBuyers[0]?.totalTickets || 1;
    
    return (
        <div className="min-h-screen w-full bg-gray-950 text-white font-sans overflow-x-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-gray-950 bg-[radial-gradient(#ffffff11_1px,transparent_1px)] [background-size:32px_32px]"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-orange-900/30 via-transparent to-gray-950"></div>
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-radial-gradient from-yellow-500/20 via-transparent to-transparent -translate-x-1/4 -translate-y-1/4 blur-3xl"></div>

            <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                <header className="text-center mb-16 animate-fade-in-up">
                    <Trophy className="h-16 w-16 mx-auto text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)] animate-float" />
                    {/* ✅ CAMBIO: Título actualizado */}
                    <h1 className="mt-4 text-5xl sm:text-7xl font-black font-display tracking-wider uppercase">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-orange-300 to-white">
                            TOP COMPRADORES
                        </span>
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
                        Celebrando a nuestros campeones. ¡Gracias por vuestro increíble apoyo y dedicación!
                    </p>
                </header>

                {topBuyers.length > 0 ? (
                    <>
                        {podiumBuyers.length > 0 && (
                            <div className="group flex justify-center items-end gap-2 sm:gap-4 mb-16 h-[350px] sm:h-[420px] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                {podiumBuyers[1] && <PodiumItem buyer={podiumBuyers[1]} position={2} />}
                                {podiumBuyers[0] && <PodiumItem buyer={podiumBuyers[0]} position={1} />}
                                {podiumBuyers[2] && <PodiumItem buyer={podiumBuyers[2]} position={3} />}
                            </div>
                        )}
                        
                        {otherBuyers.length > 0 && (
                             <div className="space-y-3">
                                {otherBuyers.map((buyer) => (
                                    <LeaderboardRow key={buyer.buyerEmail} buyer={buyer} maxTickets={maxTickets} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 px-6 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl animate-fade-in-up">
                        <h2 className="text-3xl font-bold font-display text-white/80">La Competición es Joven</h2>
                        <p className="mt-3 text-white/50 max-w-md mx-auto">Los puestos en el top esperan a sus héroes. ¡Sé el primero en dejar tu marca!</p>
                    </div>
                )}
            </main>
        </div>
    );
}