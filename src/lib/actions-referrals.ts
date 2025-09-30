// lib/actions-referrals.ts
"use server";

import { z } from "zod";
import { db } from "./db";
import { referrals, purchases, raffles } from "./db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Tipos para la sesión
interface SessionData {
  referral: {
    id: string;
    name: string;
    email: string;
    code: string;
  };
}

const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: "jorvilanina-referral-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getReferralSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.referral) {
    return null;
  }
  return session;
}

const LoginSchema = z.object({
  email: z.string().email("Email inválido."),
  code: z.string().length(4, "El código debe tener 4 dígitos."),
});

export async function referralLoginAction(prevState: any, formData: FormData) {
  const validatedFields = LoginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { success: false, message: "Datos inválidos." };
  }
  
  const { email, code } = validatedFields.data;

  try {
    const referral = await db.query.referrals.findFirst({
      where: and(
        eq(referrals.email, email.toLowerCase()),
        eq(referrals.code, code),
        eq(referrals.isActive, true)
      ),
    });

    if (!referral) {
      return { success: false, message: "Credenciales incorrectas o cuenta inactiva." };
    }

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.referral = {
      id: referral.id,
      name: referral.name,
      email: referral.email,
      code: referral.code,
    };
    await session.save();

    revalidatePath("/referidos");
    redirect("/referidos");

  } catch (error) {
    console.error("Error en el login de referido:", error);
    return { success: false, message: "Error del servidor. Inténtalo de nuevo." };
  }
}

export async function referralLogoutAction() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.destroy();
  revalidatePath("/referidos");
  redirect("/referidos");
}

export async function getActiveRafflesForReferrals() {
    try {
        const activeRaffles = await db.query.raffles.findMany({
            where: eq(raffles.status, "active"),
            columns: {
                id: true,
                name: true,
                slug: true,
            },
            with: {
                images: {
                    columns: { url: true },
                    limit: 1,
                },
            },
            orderBy: desc(raffles.createdAt),
        });

        return activeRaffles.map(r => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            imageUrl: r.images[0]?.url || null,
        }));

    } catch (error) {
        console.error("Error al obtener rifas activas para referidos:", error);
        return [];
    }
}

export async function getReferralCommissions() {
  const session = await getReferralSession();
  if (!session?.referral) {
    throw new Error("Acceso no autorizado.");
  }

  try {
    const referral = await db.query.referrals.findFirst({
      where: eq(referrals.id, session.referral.id),
    });
    if (!referral) throw new Error("Referido no encontrado.");

    const confirmedPurchases = await db.query.purchases.findMany({
      where: and(
        eq(purchases.referralId, referral.id),
        eq(purchases.status, "confirmed")
      ),
      orderBy: desc(purchases.createdAt),
    });

    // Lógica de cálculo de comisiones
    const totalSales = confirmedPurchases.length;
    const totalCommissions = totalSales * parseFloat(referral.commissionRate);
    const totalRevenue = confirmedPurchases.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const customers = new Map<string, {
      email: string;
      buyerName: string | null;
      totalPurchases: number;
      commissionEarned: number;
      firstPurchaseDate: Date;
    }>();

    for (const p of confirmedPurchases) {
      if (!customers.has(p.buyerEmail)) {
        customers.set(p.buyerEmail, {
          email: p.buyerEmail,
          buyerName: p.buyerName,
          totalPurchases: 0,
          commissionEarned: 0,
          firstPurchaseDate: p.createdAt,
        });
      }
      const customer = customers.get(p.buyerEmail)!;
      customer.totalPurchases += 1;
      customer.commissionEarned += parseFloat(referral.commissionRate);
      if (p.createdAt < customer.firstPurchaseDate) {
        customer.firstPurchaseDate = p.createdAt;
      }
    }

    const commissionsData = Array.from(customers.values()).sort((a,b) => b.firstPurchaseDate.getTime() - a.firstPurchaseDate.getTime());

    return {
      commissionsData,
      summary: {
        totalCommissions,
        totalSales,
        totalRevenue,
        uniqueCustomers: customers.size,
        commissionPerSale: parseFloat(referral.commissionRate),
      },
    };
  } catch (error) {
    console.error("Error calculando comisiones:", error);
    throw new Error("No se pudieron calcular las comisiones.");
  }
}