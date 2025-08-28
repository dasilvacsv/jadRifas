// lib/actions.ts
"use server";

import { z } from "zod";
import { db } from "./db";
import {
  raffles,
  purchases,
  tickets,
  purchaseStatusEnum,
  users,
  raffleStatusEnum,
  raffleImages,
  paymentMethods,
  currencyEnum,
} from "./db/schema";
import { revalidatePath } from "next/cache";
import { eq, desc, inArray, and, lt, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { uploadToS3, deleteFromS3 } from "./s3";
import crypto from "crypto";

// --- Credenciales de Pabilo
const PABILO_API_KEY = "af757c4f-507e-48ef-8309-4a1eae692f59";
const PABILO_API_URL = "https://api.pabilo.app/userbankpayment/68aa8cc1cfe77b8f17bfbfdd/betaserio";

// --- TIPOS DE RESPUESTA
export type ActionState = {
  success: boolean;
  message: string;
  data?: any;
};

// ----------------------------------------------------------------
// ACTIONS PARA AUTENTICACIÓN
// ----------------------------------------------------------------

const RegisterSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["admin", "user"]).default("user"),
});

export async function registerAction(formData: FormData): Promise<ActionState> {
  const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { success: false, message: "Error de validación" };
  const { name, email, password, role } = validatedFields.data;
  try {
    const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existingUser) return { success: false, message: "El email ya está registrado" };
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await db.insert(users).values({ name, email, password: hashedPassword, role }).returning({ id: users.id });
    return { success: true, message: "Usuario registrado exitosamente", data: newUser[0] };
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    return { success: false, message: "Error del servidor" };
  }
}

// ----------------------------------------------------------------
// ACTIONS PARA COMPRAS Y TICKETS
// ----------------------------------------------------------------

const ReserveTicketsSchema = z.object({
  raffleId: z.string(),
  ticketCount: z.coerce.number().int().min(1),
});

export async function reserveTicketsAction(formData: FormData): Promise<ActionState> {
  const validatedFields = ReserveTicketsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { success: false, message: "Datos inválidos." };
  
  const { raffleId, ticketCount } = validatedFields.data;
  const RESERVATION_MINUTES = 10;

  try {
    const reservedData = await db.transaction(async (tx) => {
      // Check if raffle exists and is active
      const raffle = await tx.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
      if (!raffle) throw new Error("Rifa no encontrada.");
      if (raffle.status !== 'active') throw new Error("La rifa no está activa.");

      // Check if tickets exist for this raffle
      const existingTicketsCount = await tx.select({ count: sql`count(*)` })
        .from(tickets)
        .where(eq(tickets.raffleId, raffleId));
      
      // If no tickets exist, generate them
      if (Number(existingTicketsCount[0].count) === 0) {
        console.log(`Generando tickets para la rifa ${raffleId}...`);
        const ticketsToGenerate = [];
        for (let i = 0; i < 10000; i++) {
          const ticketNumber = i.toString().padStart(4, '0');
          ticketsToGenerate.push({
            ticketNumber,
            raffleId,
            status: 'available' as const,
          });
        }

        // Insert tickets in batches
        const batchSize = 1000;
        for (let i = 0; i < ticketsToGenerate.length; i += batchSize) {
          const batch = ticketsToGenerate.slice(i, i + batchSize);
          await tx.insert(tickets).values(batch);
        }
        console.log(`Tickets generados exitosamente para la rifa ${raffleId}`);
      }

      // Clean up expired reservations
      await tx.update(tickets).set({ status: 'available', reservedUntil: null, purchaseId: null }).where(and(eq(tickets.raffleId, raffleId), eq(tickets.status, 'reserved'), lt(tickets.reservedUntil, new Date())));
      
      // Find available tickets
      const availableTickets = await tx.select({ id: tickets.id, ticketNumber: tickets.ticketNumber }).from(tickets).where(and(eq(tickets.raffleId, raffleId), eq(tickets.status, 'available'))).orderBy(sql`RANDOM()`).limit(ticketCount).for("update", { skipLocked: true });
      
      if (availableTickets.length < ticketCount) throw new Error("No hay suficientes tickets disponibles para apartar.");
      
      const ticketIdsToReserve = availableTickets.map(t => t.id);
      const reservationTime = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
      await tx.update(tickets).set({ status: 'reserved', reservedUntil: reservationTime }).where(inArray(tickets.id, ticketIdsToReserve));
      
      return { reservedTickets: availableTickets.map(t => t.ticketNumber), reservedUntil: reservationTime.toISOString() };
    });
    return { success: true, message: `${ticketCount} tickets apartados por ${RESERVATION_MINUTES} minutos.`, data: reservedData };
  } catch (error: any) {
    console.error("Error al apartar tickets:", error);
    return { success: false, message: error.message || "Ocurrió un error en el servidor." };
  }
}

const BuyTicketsSchema = z.object({
  name: z.string().min(3, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono inválido"),
  raffleId: z.string(),
  paymentReference: z.string().min(1, "La referencia es requerida"),
  paymentMethod: z.string().min(1, "Debe seleccionar un método de pago"),
  paymentScreenshot: z.instanceof(File).refine(file => file.size > 0, "La captura es requerida."),
  reservedTickets: z.string().min(1, "No hay tickets apartados para comprar."),
});

export async function buyTicketsAction(formData: FormData): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const paymentScreenshotFile = formData.get('paymentScreenshot') as File | null;
  const validatedFields = BuyTicketsSchema.safeParse({ ...data, paymentScreenshot: paymentScreenshotFile });

  if (!validatedFields.success) { return { success: false, message: "Error de validación: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) }; }
  const { name, email, phone, raffleId, paymentReference, paymentMethod, reservedTickets } = validatedFields.data;
  const ticketNumbers = reservedTickets.split(',');
  let paymentScreenshotUrl = '';
  try {
    const buffer = Buffer.from(await validatedFields.data.paymentScreenshot.arrayBuffer());
    const key = `purchases/${crypto.randomUUID()}-${validatedFields.data.paymentScreenshot.name}`;
    paymentScreenshotUrl = await uploadToS3(buffer, key, validatedFields.data.paymentScreenshot.type);
  } catch (error) {
    console.error("Error al subir captura:", error);
    return { success: false, message: "Error al subir la imagen del pago." };
  }
  
  try {
    const raffle = await db.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
    if (!raffle) return { success: false, message: "La rifa no existe." };
    const amount = ticketNumbers.length * parseFloat(raffle.price);
    let purchaseStatus: "pending" | "confirmed" = "pending";
    let responseMessage = "¡Compra registrada! Recibirás un correo cuando tus tickets sean aprobados.";

    const selectedPaymentMethod = await db.query.paymentMethods.findFirst({ where: eq(paymentMethods.title, paymentMethod) });

    if (selectedPaymentMethod && selectedPaymentMethod.triggersApiVerification) {
      const referenceToSend = paymentReference.slice(-4);
      const amountToSend = Math.round(amount);
      console.log(`🔵 Intentando verificar con Pabilo para [${paymentMethod}]...`);
      console.log({ amount: amountToSend, bank_reference: referenceToSend });

      try {
        const pabiloResponse = await fetch(PABILO_API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'appKey': PABILO_API_KEY,
          },
          body: JSON.stringify({
            amount: amountToSend,
            bank_reference: referenceToSend,
          }),
        });
        const pabiloData = await pabiloResponse.json();
        if (pabiloResponse.ok && pabiloData.data?.user_bank_payment?.status === 'paid') {
          console.info("✅ Pabilo CONFIRMÓ el pago exitosamente. La compra será automática.");
          console.log("Respuesta de Pabilo:", pabiloData);
          purchaseStatus = "confirmed";
          responseMessage = "¡Pago confirmado automáticamente! Tus tickets ya han sido generados.";
        } else {
          console.warn("⚠️ Pabilo NO encontró el pago. Pasando a verificación manual.");
          console.log("Respuesta de Pabilo:", pabiloData);
        }
      } catch (apiError) {
        console.error("⛔ Error de conexión con la API de Pabilo. No se pudo verificar el pago.", apiError);
      }
    }
    
    const newPurchase = await db.transaction(async (tx) => {
      const ticketsToUpdate = await tx.select({ id: tickets.id }).from(tickets).where(and(eq(tickets.raffleId, raffleId), inArray(tickets.ticketNumber, ticketNumbers), eq(tickets.status, 'reserved')));
      if (ticketsToUpdate.length !== ticketNumbers.length) throw new Error("Tu reservación expiró o los tickets ya no son válidos. Intenta de nuevo.");
      const [createdPurchase] = await tx.insert(purchases).values({
        raffleId, buyerName: name, buyerEmail: email, buyerPhone: phone, ticketCount: ticketNumbers.length,
        amount: amount.toString(), paymentMethod, paymentReference, paymentScreenshotUrl, status: purchaseStatus,
      }).returning({ id: purchases.id });
      await tx.update(tickets).set({
        status: purchaseStatus === 'confirmed' ? 'sold' : 'reserved',
        purchaseId: createdPurchase.id,
        reservedUntil: null,
      }).where(inArray(tickets.id, ticketsToUpdate.map(t => t.id)));
      return createdPurchase;
    });

    revalidatePath(`/rifas/${raffleId}`);
    revalidatePath("/dashboard");
    return { success: true, message: responseMessage, data: newPurchase };
  } catch (error: any) {
    console.error("Error al comprar tickets:", error);
    return { success: false, message: error.message || "Ocurrió un error en el servidor." };
  }
}

const UpdatePurchaseStatusSchema = z.object({
  purchaseId: z.string(),
  newStatus: z.enum(purchaseStatusEnum.enumValues),
});

export async function updatePurchaseStatusAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = UpdatePurchaseStatusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { success: false, message: "Datos inválidos." };
  const { purchaseId, newStatus } = validatedFields.data;
  try {
    await db.transaction(async (tx) => {
      const purchase = await tx.query.purchases.findFirst({ where: eq(purchases.id, purchaseId) });
      if (!purchase || purchase.status !== "pending") throw new Error("Esta compra no se puede modificar.");
      if (newStatus === "confirmed") {
        await tx.update(tickets).set({ status: 'sold' }).where(eq(tickets.purchaseId, purchaseId));
      } else if (newStatus === "rejected") {
        await tx.update(tickets).set({ status: 'available', purchaseId: null }).where(eq(tickets.purchaseId, purchaseId));
      }
      await tx.update(purchases).set({ status: newStatus }).where(eq(purchases.id, purchaseId));
    });
    revalidatePath("/dashboard");
    revalidatePath("/mis-tickets");
    revalidatePath(`/rifas`);
    return { success: true, message: `La compra ha sido ${newStatus === "confirmed" ? "confirmada" : "rechazada"}.` };
  } catch (error: any) {
    console.error("Error al actualizar compra:", error);
    return { success: false, message: error.message || "Ocurrió un error en el servidor." };
  }
}

export async function findMyTicketsAction(formData: FormData): Promise<ActionState> {
  const validatedFields = z.object({ email: z.string().email("Debes ingresar un email válido.") }).safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { success: false, message: "Email inválido." };
  const { email } = validatedFields.data;
  try {
    const userPurchases = await db.query.purchases.findMany({
      where: eq(purchases.buyerEmail, email),
      orderBy: desc(purchases.createdAt),
      with: { raffle: { with: { images: { limit: 1 }, winnerTicket: { with: { purchase: true } } } }, tickets: { columns: { id: true, ticketNumber: true } } },
    });
    return { success: true, message: "Datos encontrados.", data: userPurchases };
  } catch (error) {
    console.error("Error al buscar tickets:", error);
    return { success: false, message: "Ocurrió un error en el servidor." };
  }
}

// ----------------------------------------------------------------
// ACTIONS PARA GESTIÓN DE RIFAS (ADMIN)
// ----------------------------------------------------------------

const CreateRaffleSchema = z.object({
  name: z.string().min(5, "El nombre debe tener al menos 5 caracteres."),
  description: z.string().optional(),
  price: z.coerce.number().positive("El precio debe ser un número positivo."),
  minimumTickets: z.coerce.number().int().positive("El mínimo de tickets debe ser un número positivo."),
  limitDate: z.string().min(1, "La fecha límite es requerida."),
  currency: z.enum(currencyEnum.enumValues, { // Usamos el enum del schema para validación
    required_error: "La moneda es requerida.",
  }),
});

export async function createRaffleAction(formData: FormData): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const images = formData.getAll("images") as File[];
  const validatedFields = CreateRaffleSchema.safeParse(data);

  if (!validatedFields.success) {
      // Devolvemos el primer error para una mejor retroalimentación al usuario
      const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, message: firstError || "Error de validación en los campos." };
  }
  
  // --- MODIFICADO: Extraemos 'currency' de los datos validados ---
  const { name, description, price, minimumTickets, limitDate, currency } = validatedFields.data;
  // --- FIN MODIFICADO ---

  for (const file of images) {
    if (file.size > 5 * 1024 * 1024) return { success: false, message: `El archivo ${file.name} es demasiado grande.` };
    if (!file.type.startsWith("image/")) return { success: false, message: `El archivo ${file.name} no es una imagen.` };
  }

  try {
    const newRaffle = await db.transaction(async (tx) => {
      // --- MODIFICADO: Pasamos 'currency' al insertar en la base de datos ---
      const [createdRaffle] = await tx.insert(raffles).values({
        name, 
        description, 
        price: price.toString(), 
        minimumTickets, 
        status: "draft", 
        limitDate: new Date(limitDate),
        currency, // <-- Campo añadido
      }).returning({ id: raffles.id });
      // --- FIN MODIFICADO ---

      const imageUrls = await Promise.all(images.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const key = `raffles/${createdRaffle.id}/${crypto.randomUUID()}-${file.name}`;
        const url = await uploadToS3(buffer, key, file.type);
        return { url, raffleId: createdRaffle.id };
      }));

      if (imageUrls.length > 0) await tx.insert(raffleImages).values(imageUrls);
      return createdRaffle;
    });

    revalidatePath("/rifas");
    return { success: true, message: "Rifa creada con éxito.", data: newRaffle };
  } catch (error) {
    console.error("Error al crear la rifa:", error);
    return { success: false, message: "Ocurrió un error al crear la rifa." };
  }
}

const UpdateRaffleStatusSchema = z.object({
  raffleId: z.string(),
  status: z.enum(raffleStatusEnum.enumValues),
});

export async function updateRaffleStatusAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = UpdateRaffleStatusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { success: false, message: "Datos inválidos." };
  const { raffleId, status } = validatedFields.data;
  try {
    await db.transaction(async (tx) => {
      // Get the current raffle to check its status
      const currentRaffle = await tx.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
      if (!currentRaffle) throw new Error("Rifa no encontrada.");

      // Update the raffle status
      await tx.update(raffles).set({ status, updatedAt: new Date() }).where(eq(raffles.id, raffleId));

      // If activating a draft raffle, generate tickets
      if (currentRaffle.status === 'draft' && status === 'active') {
        const ticketsToGenerate = [];
        
        // Generate tickets from 0000 to 9999 (10,000 tickets)
        for (let i = 0; i < 10000; i++) {
          const ticketNumber = i.toString().padStart(4, '0');
          ticketsToGenerate.push({
            ticketNumber,
            raffleId,
            status: 'available' as const,
          });
        }

        // Insert tickets in batches to avoid memory issues
        const batchSize = 1000;
        for (let i = 0; i < ticketsToGenerate.length; i += batchSize) {
          const batch = ticketsToGenerate.slice(i, i + batchSize);
          await tx.insert(tickets).values(batch);
        }
      }
    });

    revalidatePath("/rifas");
    revalidatePath(`/rifas/${raffleId}`);
    return { success: true, message: "Estado de la rifa actualizado." };
  } catch (error) {
    console.error("Error al actualizar rifa:", error);
    return { success: false, message: "Ocurrió un error en el servidor." };
  }
}

const UpdateRaffleSchema = z.object({
  raffleId: z.string(),
  name: z.string().min(5, "El nombre debe tener al menos 5 caracteres."),
  description: z.string().optional(),
  price: z.coerce.number().positive("El precio debe ser un número positivo."),
  minimumTickets: z.coerce.number().int().positive("El mínimo de tickets debe ser positivo."),
  limitDate: z.string().min(1, "La fecha límite es requerida."),
  currency: z.enum(["USD", "VES"], { // Campo añadido para la validación
    required_error: "La moneda es requerida.",
  }),
});

export async function updateRaffleAction(formData: FormData): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const newImages = formData.getAll("images") as File[];
  const imagesToDeleteString = formData.get('imagesToDelete') as string | null;
  const validatedFields = UpdateRaffleSchema.safeParse(data);
  
  if (!validatedFields.success) {
    return { success: false, message: "Error de validación en los campos." };
  }
  
  // --- MODIFICADO: Extraemos 'currency' de los datos validados ---
  const { raffleId, name, description, price, minimumTickets, limitDate, currency } = validatedFields.data;
  const imageIdsToDelete = imagesToDeleteString?.split(',').filter(id => id.trim() !== '') || [];

  try {
    await db.transaction(async (tx) => {
      // --- MODIFICADO: Pasamos 'currency' al actualizar la base de datos ---
      await tx.update(raffles).set({ 
        name, 
        description, 
        price: price.toString(), 
        minimumTickets, 
        limitDate: new Date(limitDate), 
        updatedAt: new Date(),
        currency, // <-- Campo añadido
      }).where(eq(raffles.id, raffleId));

      if (imageIdsToDelete.length > 0) {
        const images = await tx.query.raffleImages.findMany({ where: inArray(raffleImages.id, imageIdsToDelete) });
        for (const image of images) {
          const key = image.url.substring(image.url.indexOf('raffles/'));
          await deleteFromS3(key);
        }
        await tx.delete(raffleImages).where(inArray(raffleImages.id, imageIdsToDelete));
      }

      if (newImages.length > 0) {
        const imageUrls = await Promise.all(newImages.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          const key = `raffles/${raffleId}/${crypto.randomUUID()}-${file.name}`;
          const url = await uploadToS3(buffer, key, file.type);
          return { url, raffleId: raffleId };
        }));
        if (imageUrls.length > 0) await tx.insert(raffleImages).values(imageUrls);
      }
    });

    revalidatePath("/rifas");
    revalidatePath(`/rifas/${raffleId}`);
    return { success: true, message: "Rifa actualizada con éxito." };
  } catch (error) {
    console.error("Error al actualizar la rifa:", error);
    return { success: false, message: "Ocurrió un error en el servidor." };
  }
}

const DrawWinnerSchema = z.object({
  raffleId: z.string(),
  lotteryNumber: z.string().min(4, "El número debe tener 4 dígitos.").max(4, "El número debe tener 4 dígitos."),
  winnerProof: z.instanceof(File, { message: "La captura de la lotería es requerida." })
    .refine((file) => file.size > 0, "La captura no puede estar vacía.")
    .refine((file) => file.size < 5 * 1024 * 1024, "La imagen no debe pesar más de 5MB.")
    .refine((file) => file.type.startsWith("image/"), "El archivo debe ser una imagen."),
});

export async function drawWinnerAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const winnerProofFile = formData.get('winnerProof') as File | null;
  const validatedFields = DrawWinnerSchema.safeParse({ ...data, winnerProof: winnerProofFile });

  if (!validatedFields.success) {
    return { success: false, message: "Error de validación: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
  }

  const { raffleId, lotteryNumber, winnerProof } = validatedFields.data;

  try {
    const raffle = await db.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
    if (!raffle || raffle.status !== 'finished') {
      return { success: false, message: "La rifa no está en estado finalizado." };
    }

    const winningTicket = await db.query.tickets.findFirst({
      where: and(
        eq(tickets.raffleId, raffleId), 
        eq(tickets.ticketNumber, lotteryNumber),
        eq(tickets.status, 'sold') // <-- AÑADIDO: Asegura que el ticket haya sido vendido
      ),
      with: { purchase: true }
    });

    // Ahora, si el ticket no fue vendido (o no existe), esta condición fallará.
    if (!winningTicket || !winningTicket.purchase) {
      return { success: false, message: `El ticket #${lotteryNumber} no fue vendido o no existe. La rifa puede ser pospuesta.` };
    }

    const buffer = Buffer.from(await winnerProof.arrayBuffer());
    const key = `winners/${raffleId}/${crypto.randomUUID()}-${winnerProof.name}`;
    const winnerProofUrl = await uploadToS3(buffer, key, winnerProof.type);

    await db.update(raffles).set({
      winnerTicketId: winningTicket.id,
      winnerLotteryNumber: lotteryNumber,
      winnerProofUrl,
    }).where(eq(raffles.id, raffleId));

    revalidatePath("/rifas");
    revalidatePath(`/rifas/${raffleId}`);

    return {
      success: true,
      message: "¡Ganador registrado con éxito!",
      data: {
        winnerTicketNumber: winningTicket.ticketNumber,
        winnerName: winningTicket.purchase.buyerName,
        winnerEmail: winningTicket.purchase.buyerEmail,
        winnerProofUrl,
      },
    };
  } catch (error: any) {
    console.error("Error al registrar ganador:", error);
    return { success: false, message: error.message || "Ocurrió un error en el servidor." };
  }
}

const PostponeRaffleSchema = z.object({
  raffleId: z.string(),
  newLimitDate: z.string().min(1, "La nueva fecha límite es requerida."),
});

export async function postponeRaffleAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = PostponeRaffleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { success: false, message: "Datos inválidos." };
  const { raffleId, newLimitDate } = validatedFields.data;
  try {
    const raffle = await db.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
    // La rifa debe estar en 'finished' para poder posponerse
    if (!raffle || raffle.status !== 'finished') return { success: false, message: "La rifa no puede ser pospuesta en su estado actual." };

    // --- MEJORA DE LÓGICA AQUÍ ---
    // En lugar de 'postponed', la cambiamos a 'active' con la nueva fecha.
    // Esto la "reactiva" para el futuro sorteo.
    await db.update(raffles).set({
      status: 'active',
      limitDate: new Date(newLimitDate)
    }).where(eq(raffles.id, raffleId));

    revalidatePath(`/rifas/${raffleId}`);
    revalidatePath("/rifas");
    return { success: true, message: "Rifa pospuesta con éxito. Se ha reactivado con la nueva fecha." };
  } catch (error: any) {
    console.error("Error al posponer rifa:", error);
    return { success: false, message: error.message || "Ocurrió un error en el servidor." };
  }
}

// --- NUEVA FUNCIÓN PARA GENERAR TICKETS EN RIFAS EXISTENTES ---
export async function generateTicketsForRaffle(raffleId: string): Promise<ActionState> {
  try {
    const result = await db.transaction(async (tx) => {
      // Check if raffle exists and is active
      const raffle = await tx.query.raffles.findFirst({ where: eq(raffles.id, raffleId) });
      if (!raffle) {
        throw new Error("Rifa no encontrada.");
      }
      if (raffle.status !== 'active') {
        throw new Error("Solo se pueden generar tickets para rifas activas.");
      }

      // Check if tickets already exist
      const existingTickets = await tx.query.tickets.findMany({ 
        where: eq(tickets.raffleId, raffleId),
        limit: 1 
      });
      
      if (existingTickets.length > 0) {
        throw new Error("Esta rifa ya tiene tickets generados.");
      }

      // Generate tickets from 0000 to 9999 (10,000 tickets)
      const ticketsToGenerate = [];
      for (let i = 0; i < 10000; i++) {
        const ticketNumber = i.toString().padStart(4, '0');
        ticketsToGenerate.push({
          ticketNumber,
          raffleId,
          status: 'available' as const,
        });
      }

      // Insert tickets in batches
      const batchSize = 1000;
      for (let i = 0; i < ticketsToGenerate.length; i += batchSize) {
        const batch = ticketsToGenerate.slice(i, i + batchSize);
        await tx.insert(tickets).values(batch);
      }

      return { ticketsGenerated: ticketsToGenerate.length };
    });

    revalidatePath("/rifas");
    revalidatePath(`/rifas/${raffleId}`);
    return { 
      success: true, 
      message: `Se generaron ${result.ticketsGenerated} tickets exitosamente.`, 
      data: result 
    };
  } catch (error: any) {
    console.error("Error al generar tickets:", error);
    return { success: false, message: error.message || "Ocurrió un error en el servidor." };
  }
}

const PaymentMethodSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  icon: z.instanceof(File).optional(),
  // Eliminamos 'details' ya que ahora es estructurado
  accountHolderName: z.string().optional().nullable(),
  rif: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  // +++ CAMPOS NUEVOS: AÑADIDOS para Zinli y Binance +++
  email: z.string().email("Debe ser un correo válido.").optional().nullable().or(z.literal("")),
  walletAddress: z.string().optional().nullable(),
  network: z.string().optional().nullable(),
  // --- FIN CAMPOS NUEVOS ---
  isActive: z.preprocess((val) => val === 'on' || val === true || val === 'true', z.boolean()),
  triggersApiVerification: z.preprocess((val) => val === 'on' || val === true || val === 'true', z.boolean()),
});


export async function createPaymentMethodAction(prevState: any, formData: FormData): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const iconFile = formData.get('icon') as File | null;
  
  const validatedFields = PaymentMethodSchema.safeParse({ ...data, icon: iconFile });
  
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { success: false, message: firstError || "Datos inválidos." };
  }
  
  // +++ MODIFICADO: Extraemos todos los campos del schema validado +++
  const { 
    icon, 
    title, 
    accountHolderName, 
    rif, 
    phoneNumber, 
    bankName, 
    accountNumber, 
    email, 
    walletAddress, 
    network, 
    isActive, 
    triggersApiVerification 
  } = validatedFields.data;

  let iconUrl: string | undefined = undefined;

  try {
    if (icon && icon.size > 0) {
      const buffer = Buffer.from(await icon.arrayBuffer());
      const key = `payment-methods/${crypto.randomUUID()}-${icon.name}`;
      iconUrl = await uploadToS3(buffer, key, icon.type);
    }

    // +++ MODIFICADO: Insertamos todos los campos en la base de datos +++
    await db.insert(paymentMethods).values({ 
      title, 
      iconUrl, 
      accountHolderName, 
      rif, 
      phoneNumber, 
      bankName, 
      accountNumber, 
      email, 
      walletAddress, 
      network, 
      isActive, 
      triggersApiVerification 
    });
    
    revalidatePath("/admin/metodos-pago");
    return { success: true, message: "Método de pago creado con éxito." };
  } catch (error) {
    console.error("Error al crear el método de pago:", error);
    return { success: false, message: "Error al crear el método de pago. El título podría estar duplicado." };
  }
}

export async function updatePaymentMethodAction(prevState: any, formData: FormData): Promise<ActionState> {
  const id = formData.get('id') as string;
  if (!id) return { success: false, message: "ID del método no encontrado." };
  
  const data = Object.fromEntries(formData.entries());
  const iconFile = formData.get('icon') as File | null;
  
  const validatedFields = PaymentMethodSchema.safeParse({ ...data, icon: iconFile });
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { success: false, message: firstError || "Datos inválidos." };
  }

  // +++ MODIFICADO: Extraemos todos los campos del schema validado +++
  const { 
    icon, 
    title, 
    accountHolderName, 
    rif, 
    phoneNumber, 
    bankName, 
    accountNumber, 
    email, 
    walletAddress, 
    network, 
    isActive, 
    triggersApiVerification 
  } = validatedFields.data;

  let iconUrl: string | undefined = undefined;

  try {
    if (icon && icon.size > 0) {
      const oldMethod = await db.query.paymentMethods.findFirst({ where: eq(paymentMethods.id, id) });
      if (oldMethod?.iconUrl) {
        const oldKey = oldMethod.iconUrl.substring(oldMethod.iconUrl.indexOf('payment-methods/'));
        await deleteFromS3(oldKey);
      }
      
      const buffer = Buffer.from(await icon.arrayBuffer());
      const key = `payment-methods/${crypto.randomUUID()}-${icon.name}`;
      iconUrl = await uploadToS3(buffer, key, icon.type);
    }
    
    // +++ MODIFICADO: Actualizamos todos los campos en la base de datos +++
    await db.update(paymentMethods).set({ 
      title, 
      accountHolderName, 
      rif, 
      phoneNumber, 
      bankName, 
      accountNumber, 
      email, 
      walletAddress, 
      network, 
      isActive, 
      triggersApiVerification,
      ...(iconUrl && { iconUrl })
    }).where(eq(paymentMethods.id, id));
    
    revalidatePath("/admin/metodos-pago");
    revalidatePath("/rifa"); 
    return { success: true, message: "Método de pago actualizado." };
  } catch (error) {
    console.error("Error al actualizar método de pago:", error);
    return { success: false, message: "Error al actualizar." };
  }
}

export async function deletePaymentMethodAction(prevState: any, formData: FormData): Promise<ActionState> {
  const id = formData.get('id') as string;
  try {
    // --- LÓGICA PARA BORRAR IMAGEN DE S3 AL ELIMINAR ---
    const methodToDelete = await db.query.paymentMethods.findFirst({ where: eq(paymentMethods.id, id) });
    if (methodToDelete?.iconUrl) {
        const key = methodToDelete.iconUrl.substring(methodToDelete.iconUrl.indexOf('payment-methods/'));
        await deleteFromS3(key);
    }
    
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    revalidatePath("/admin/metodos-pago");
    return { success: true, message: "Método de pago eliminado." };
  } catch (error) {
    return { success: false, message: "Error al eliminar." };
  }
}