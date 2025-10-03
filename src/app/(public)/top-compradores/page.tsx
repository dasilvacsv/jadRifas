// app/top-compradores/page.tsx

import { db } from "@/lib/db";
import { purchases } from "@/lib/db/schema";
// ✅ IMPORTACIONES ACTUALIZADAS: Se añaden 'and', 'isNotNull' y 'ne' para la nueva consulta
import { sql, desc, eq, and, isNotNull, ne } from "drizzle-orm";
import { Diamond, Shield, Star, Medal, Trophy } from 'lucide-react';
import React, { ReactNode } from 'react';
import clsx from 'clsx';

// ✅ FORZAR RENDERIZADO DINÁMICO
export const dynamic = 'force-dynamic';

// --- SECCIÓN DE RANGOS (Sin cambios) ---
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
    { name: 'Diamante', icon: <Diamond className="h-full w-full" />, color: 'text-cyan-300', bgColor: 'bg-cyan-300', borderColor: 'border-cyan-300', glowColor: 'shadow-cyan-300/60' },
    { name: 'Platino', icon: <Shield className="h-full w-full" />, color: 'text-slate-300', bgColor: 'bg-slate-300', borderColor: 'border-slate-300', glowColor: 'shadow-slate-300/60' },
    { name: 'Oro', icon: <Star className="h-full w-full" />, color: 'text-yellow-400', bgColor: 'bg-yellow-400', borderColor: 'border-yellow-400', glowColor: 'shadow-yellow-400/60' },
    { name: 'Plata', icon: <Medal className="h-full w-full" />, color: 'text-gray-400', bgColor: 'bg-gray-400', borderColor: 'border-gray-400', glowColor: 'shadow-gray-400/60' },
    { name: 'Bronce', icon: <Trophy className="h-full w-full" />, color: 'text-orange-400', bgColor: 'bg-orange-400', borderColor: 'border-orange-400', glowColor: 'shadow-orange-400/60' },
];

const getRankForIndex = (index: number): Rank => {
    return RANKS[index] || RANKS[RANKS.length - 1];
};

// --- ✅ FUNCIÓN PARA OBTENER DATOS (LÓGICA MODIFICADA) ---
async function getTopBuyers(): Promise<BuyerWithRank[]> {
    try {
        // La lógica ahora agrupa las compras por número de teléfono.
        const topBuyersData = await db
            .select({
                // Al agrupar, se debe especificar cómo elegir un nombre y email.
                // Usamos MAX() para obtener un valor consistente para cada grupo de teléfono.
                buyerName: sql<string>`max(${purchases.buyerName})`.as('buyer_name'),
                buyerEmail: sql<string>`max(${purchases.buyerEmail})`.as('buyer_email'),
                totalTickets: sql<number>`sum(${purchases.ticketCount})`.as('total_tickets'),
            })
            .from(purchases)
            // Se filtran compras confirmadas y con un número de teléfono válido.
            .where(and(
                eq(purchases.status, 'confirmed'),
                isNotNull(purchases.buyerPhone),
                ne(purchases.buyerPhone, '')
            ))
            .groupBy(purchases.buyerPhone) // La clave de agrupación ahora es el teléfono.
            .orderBy(desc(sql`total_tickets`))
            .limit(5);

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
        <div className={clsx('absolute -inset-1 sm:-inset-1.5 opacity-50 blur-md sm:blur-lg rounded-full animate-pulse', rank.glowColor)}></div>
        <div className={clsx('absolute -inset-0.5 sm:-inset-1 opacity-30 blur-sm rounded-full animate-pulse', rank.glowColor)}></div>
        {rank.icon}
    </div>
);

const LeaderboardRow = ({ buyer, maxTickets }: { buyer: BuyerWithRank, maxTickets: number }) => {
    const progressPercentage = (buyer.totalTickets / maxTickets) * 100;
    return (
        <div
            className={clsx("group relative flex items-center p-2 sm:p-3 gap-3 sm:gap-4 rounded-lg sm:rounded-xl border bg-gray-900/50 backdrop-blur-sm transition-all duration-300 overflow-hidden", "border-white/10 hover:border-white/20 hover:bg-gray-900/70 hover:scale-[1.02] animate-fade-in-up")}
            style={{ animationDelay: `${buyer.rankIndex * 40}ms` }}
        >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer -translate-x-full"></div>
            <div className={clsx("absolute left-0 top-0 h-full w-0.5 sm:w-1", buyer.rank.bgColor)}></div>
            <div className="flex-shrink-0 w-8 text-center font-bold text-xl sm:text-2xl font-display text-white/40">{buyer.rankIndex + 1}</div>
            <div className="flex-shrink-0"><RankBadge rank={buyer.rank} size="h-8 w-8 sm:h-10 sm:w-10" /></div>
            <div className="flex-grow min-w-0">
                <p className="font-bold text-white text-sm sm:text-base truncate">{buyer.buyerName || 'Comprador Anónimo'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className={clsx("text-xs font-semibold", buyer.rank.color)}>{buyer.rank.name}</p>
                    <div className="w-full bg-white/10 rounded-full h-1 sm:h-1.5 mt-0.5 sm:mt-1"><div className={clsx("h-1 sm:h-1.5 rounded-full", buyer.rank.bgColor)} style={{ width: `${progressPercentage}%` }}></div></div>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold font-display text-white">{buyer.totalTickets}</p>
                <p className="text-[10px] sm:text-xs text-white/50 tracking-wider uppercase">Tickets</p>
            </div>
        </div>
    );
};

const PodiumItem = ({ buyer, position }: { buyer: BuyerWithRank; position: 1 | 2 | 3 }) => {
    const isFirst = position === 1;
    const styles = {
        1: { height: 'h-full', order: 'order-2' },
        2: { height: 'h-[80%]', order: 'order-1' },
        3: { height: 'h-[65%]', order: 'order-3' },
    };

    return (
        <div className={clsx('relative flex flex-col items-center w-1/3 max-w-[150px] sm:max-w-[200px]', styles[position].height, styles[position].order)}>
            <div className="transition-transform duration-500 group-hover:-translate-y-2 sm:group-hover:-translate-y-4">
                <RankBadge rank={buyer.rank} size={isFirst ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-16 sm:w-16"} />
                {isFirst && <Sparkles />}
            </div>
            <div className="text-center mt-2 flex flex-col items-center gap-1 h-16 justify-start sm:justify-center">
                 <p className="text-sm sm:text-lg font-bold text-white px-1 w-full truncate" title={buyer.buyerName || 'Anónimo'}>
                     {buyer.buyerName || 'Anónimo'}
                 </p>
                 <div className={clsx("px-2 py-0.5 rounded-full text-xs font-bold border", buyer.rank.borderColor, buyer.rank.color, "bg-black/20")}>
                     {buyer.rank.name}
                 </div>
            </div>
            <p className={clsx("text-3xl sm:text-5xl font-black font-display mt-1 drop-shadow-lg", buyer.rank.color)}>
                {buyer.totalTickets}
            </p>
            <div className={clsx("mt-auto w-full h-full rounded-t-lg sm:rounded-t-xl bg-gradient-to-b from-white/10 to-transparent border-t-2 sm:border-t-4 flex items-center justify-center", buyer.rank.borderColor)}>
                 <span className={`text-7xl sm:text-9xl font-black font-display opacity-20 ${buyer.rank.color}`}>{position}</span>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL (Con cambio menor en el 'key') ---
export default async function TopCompradoresPage() {
    const topBuyers = await getTopBuyers();

    const podiumBuyers = topBuyers.slice(0, 3);
    const otherBuyers = topBuyers.slice(3);
    const maxTickets = topBuyers[0]?.totalTickets || 1;
    
    return (
        <div className="min-h-screen w-full bg-gray-950 text-white font-sans overflow-x-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-gray-950 bg-[radial-gradient(#ffffff11_1px,transparent_1px)] [background-size:24px_24px] sm:[background-size:32px_32px]"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-orange-900/30 via-transparent to-gray-950"></div>
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-radial-gradient from-yellow-500/20 via-transparent to-transparent -translate-x-1/4 -translate-y-1/4 blur-3xl"></div>

            <main className="relative z-10 max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-20">
                <header className="text-center mb-12 sm:mb-16 animate-fade-in-up">
                    <Trophy className="h-14 w-14 sm:h-16 sm:w-16 mx-auto text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)] animate-float" />
                    <h1 className="mt-4 text-4xl sm:text-6xl font-black font-display tracking-normal sm:tracking-wider uppercase">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-orange-300 to-white">
                            TOP COMPRADORES
                        </span>
                    </h1>
                    <p className="mt-3 sm:mt-4 text-sm sm:text-base text-white/70 max-w-2xl mx-auto">
                        <strong className="block text-yellow-300 text-base sm:text-lg mb-1 sm:mb-2">
                            ¡Quien se mantenga en el Top 1 para el 5 de Octubre de 2025 ganará $1000!
                        </strong>
                        Celebrando a nuestros campeones. ¡Gracias por vuestro increíble apoyo y dedicación!
                    </p>
                </header>

                {topBuyers.length > 0 ? (
                    <>
                        {podiumBuyers.length > 0 && (
                            <div className="group flex justify-center items-end gap-1 sm:gap-4 mb-12 sm:mb-16 h-[320px] sm:h-[400px] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                {podiumBuyers[1] && <PodiumItem buyer={podiumBuyers[1]} position={2} />}
                                {podiumBuyers[0] && <PodiumItem buyer={podiumBuyers[0]} position={1} />}
                                {podiumBuyers[2] && <PodiumItem buyer={podiumBuyers[2]} position={3} />}
                            </div>
                        )}
                        
                        {otherBuyers.length > 0 && (
                             <div className="space-y-2 sm:space-y-3">
                                {otherBuyers.map((buyer) => (
                                    // ✅ CAMBIO DE KEY: Se usa rankIndex que es único en esta lista.
                                    <LeaderboardRow key={buyer.rankIndex} buyer={buyer} maxTickets={maxTickets} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 px-4 sm:px-6 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl animate-fade-in-up">
                        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white/80">La Competición es Joven</h2>
                        <p className="mt-3 text-sm sm:text-base text-white/50 max-w-md mx-auto">Los puestos en el top esperan a sus héroes. ¡Sé el primero en dejar tu marca!</p>
                    </div>
                )}
            </main>
        </div>
    );
}