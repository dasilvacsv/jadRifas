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
} from "./db/schema";
import { revalidatePath } from "next/cache";
import { eq, desc, inArray, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { uploadToS3, deleteFromS3 } from "./s3";
import crypto from "crypto";

// --- TIPOS DE RESPUESTA ---

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
  const validatedFields = RegisterSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { success: false, message: "Error de validación" };
  }

  const { name, email, password, role } = validatedFields.data;

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existingUser) {
      return { success: false, message: "El email ya está registrado" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
      })
      .returning({ id: users.id });

    return {
      success: true,
      message: "Usuario registrado exitosamente",
      data: newUser[0],
    };
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    return { success: false, message: "Error del servidor" };
  }
}

// ----------------------------------------------------------------
// ACTIONS PARA COMPRAS Y TICKETS
// ----------------------------------------------------------------

const BuyTicketsSchema = z.object({
  name: z.string().min(3, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono inválido"),
  raffleId: z.string(),
  ticketCount: z.coerce.number().int().min(1, "Debe comprar al menos 1 ticket"),
  paymentReference: z.string().min(1, "La referencia es requerida"),
  paymentMethod: z.string().min(1, "Debe seleccionar un método de pago"),
  paymentScreenshot: z.instanceof(File, { message: "La captura de pago es requerida." })
    .refine((file) => file.size > 0, "La captura de pago no puede estar vacía.")
    .refine((file) => file.size < 5 * 1024 * 1024, "La imagen no debe pesar más de 5MB.")
    .refine((file) => file.type.startsWith("image/"), "El archivo debe ser una imagen."),
});

export async function buyTicketsAction(formData: FormData): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const paymentScreenshot = formData.get('paymentScreenshot') as File | null;
  
  const validatedFields = BuyTicketsSchema.safeParse({ ...data, paymentScreenshot });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Error de validación: " + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const {
    name,
    email,
    phone,
    raffleId,
    ticketCount,
    paymentReference,
    paymentMethod,
  } = validatedFields.data;

  let paymentScreenshotUrl = '';
  try {
    const buffer = Buffer.from(await validatedFields.data.paymentScreenshot.arrayBuffer());
    const key = `purchases/${crypto.randomUUID()}-${validatedFields.data.paymentScreenshot.name}`;
    paymentScreenshotUrl = await uploadToS3(buffer, key, validatedFields.data.paymentScreenshot.type);
  } catch (error) {
    console.error("Error al subir la captura de pago:", error);
    return { success: false, message: "Ocurrió un error al subir la imagen del pago." };
  }
  
  try {
    const raffle = await db.query.raffles.findFirst({
      where: eq(raffles.id, raffleId),
    });
    if (!raffle) {
      return { success: false, message: "La rifa no existe." };
    }

    const amount = ticketCount * parseFloat(raffle.price);

    const newPurchase = await db
      .insert(purchases)
      .values({
        raffleId,
        buyerName: name,
        buyerEmail: email,
        buyerPhone: phone,
        ticketCount,
        amount: amount.toString(),
        paymentMethod,
        paymentReference,
        paymentScreenshotUrl,
        status: "pending",
      })
      .returning({ id: purchases.id });

    revalidatePath("/dashboard");
    revalidatePath(`/rifas/${raffleId}`);

    return {
      success: true,
      message: "¡Tu compra ha sido registrada con éxito! Recibirás un correo cuando tus tickets sean aprobados.",
      data: newPurchase[0],
    };
  } catch (error) {
    console.error("Error al comprar tickets:", error);
    return { success: false, message: "Ocurrió un error en el servidor." };
  }
}


const UpdatePurchaseStatusSchema = z.object({
  purchaseId: z.string(),
  newStatus: z.enum(purchaseStatusEnum.enumValues),
});

export async function updatePurchaseStatusAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validatedFields = UpdatePurchaseStatusSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { success: false, message: "Datos inválidos." };
  }

  const { purchaseId, newStatus } = validatedFields.data;

  try {
    await db.transaction(async (tx) => {
      const purchase = await tx.query.purchases.findFirst({
        where: eq(purchases.id, purchaseId),
      });

      if (!purchase) {
        throw new Error("Compra no encontrada.");
      }
      if (purchase.status !== "pending") {
        throw new Error("Esta compra ya ha sido procesada.");
      }

      await tx
        .update(purchases)
        .set({ status: newStatus })
        .where(eq(purchases.id, purchaseId));

      if (newStatus === "confirmed") {
        // --- INICIO DE LA LÓGICA MEJORADA ---

        // 1. Obtener todos los tickets existentes para esta rifa y guardarlos en un Set para búsqueda rápida.
        const existingTicketRecords = await tx.query.tickets.findMany({
            where: eq(tickets.raffleId, purchase.raffleId),
            columns: { ticketNumber: true }
        });
        const existingTicketNumbers = new Set(existingTicketRecords.map(t => t.ticketNumber));

        // Función para generar un código alfanumérico único de 6 caracteres.
        const generateUniqueTicketNumber = (): string => {
            let ticketNumber: string;
            let isUnique = false;
            
            // Repetir hasta encontrar un código que no exista.
            while (!isUnique) {
                ticketNumber = crypto.randomBytes(3).toString('hex').toUpperCase();
                if (!existingTicketNumbers.has(ticketNumber)) {
                    isUnique = true;
                    return ticketNumber;
                }
            }
            // Este fallback es por seguridad, pero es casi imposible que se necesite.
            return `ERR${Date.now()}`; 
        };

        const newTickets = [];
        for (let i = 0; i < purchase.ticketCount; i++) {
          const uniqueTicketNumber = generateUniqueTicketNumber();
          
          newTickets.push({
            raffleId: purchase.raffleId,
            purchaseId: purchase.id,
            ticketNumber: uniqueTicketNumber,
          });

          // Agregar el nuevo número al Set para evitar duplicados en la misma transacción.
          existingTicketNumbers.add(uniqueTicketNumber);
        }
        
        if (newTickets.length > 0) {
          await tx.insert(tickets).values(newTickets);
        }
        // --- FIN DE LA LÓGICA MEJORADA ---
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/mis-tickets");
    revalidatePath(`/rifas`);

    return {
      success: true,
      message: `La compra ha sido ${
        newStatus === "confirmed" ? "confirmada" : "rechazada"
      }.`,
    };
  } catch (error: any) {
    console.error("Error al actualizar la compra:", error);
    // Devuelve un mensaje de error más específico si es el de duplicados
    if (error.code === '23505') {
        return {
            success: false,
            message: "Error crítico: Se intentó generar un ticket duplicado. Por favor, intente de nuevo."
        }
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Ocurrió un error en el servidor.",
    };
  }
}

export async function drawWinnerAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raffleId = formData.get("raffleId") as string;
  if (!raffleId) {
    return { success: false, message: "ID de la rifa no proporcionado." };
  }

  try {
    const raffle = await db.query.raffles.findFirst({
      where: eq(raffles.id, raffleId),
      with: {
        tickets: {
          columns: {
            id: true,
            ticketNumber: true,
            purchaseId: true,
          },
        },
      },
    });

    if (!raffle) {
      return { success: false, message: "Rifa no encontrada." };
    }
    if (raffle.status !== "finished") {
      return { success: false, message: "La rifa no está finalizada." };
    }
    if (raffle.winnerTicketId) {
      return { success: false, message: "El ganador ya ha sido sorteado." };
    }
    if (raffle.tickets.length < 1) {
      return { success: false, message: "No hay tickets vendidos para sortear." };
    }

    const randomIndex = Math.floor(Math.random() * raffle.tickets.length);
    const winningTicket = raffle.tickets[randomIndex];

    await db.update(raffles)
      .set({ winnerTicketId: winningTicket.id })
      .where(eq(raffles.id, raffleId));

    const winnerPurchase = await db.query.purchases.findFirst({
      where: eq(purchases.id, winningTicket.purchaseId),
    });

    revalidatePath("/rifas");
    revalidatePath(`/rifas/${raffleId}`);
    revalidatePath("/mis-tickets");

    return {
      success: true,
      message: "¡Ganador sorteado con éxito!",
      data: {
        winnerTicketNumber: winningTicket.ticketNumber,
        winnerName: winnerPurchase?.buyerName,
        winnerEmail: winnerPurchase?.buyerEmail,
      },
    };
  } catch (error) {
    console.error("Error al sortear el ganador:", error);
    return { success: false, message: "Ocurrió un error en el servidor al sortear el ganador." };
  }
}

const FindMyTicketsSchema = z.object({
  email: z.string().email("Debes ingresar un email válido."),
});

export async function findMyTicketsAction(
  formData: FormData
): Promise<ActionState> {
  const validatedFields = FindMyTicketsSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!validatedFields.success) {
    return { success: false, message: "Email inválido." };
  }

  const { email } = validatedFields.data;

  try {
    const userPurchases = await db.query.purchases.findMany({
      where: eq(purchases.buyerEmail, email),
      orderBy: desc(purchases.createdAt),
      with: {
        raffle: {
          with: {
            images: {
              limit: 1,
            },
            winnerTicket: {
              with: {
                purchase: true,
              },
            },
          },
        },
        tickets: {
          columns: {
            id: true,
            ticketNumber: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Datos encontrados.",
      data: userPurchases,
    };
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
  minimumTickets: z.coerce
    .number()
    .int()
    .positive("El mínimo de tickets debe ser un número positivo."),
});

export async function createRaffleAction(formData: FormData): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const images = formData.getAll("images") as File[];

  const validatedFields = CreateRaffleSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, message: "Error de validación en los campos." };
  }

  const { name, description, price, minimumTickets } = validatedFields.data;

  for (const file of images) {
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: `El archivo ${file.name} es demasiado grande.` };
    }
    if (!file.type.startsWith("image/")) {
      return { success: false, message: `El archivo ${file.name} no es una imagen.` };
    }
  }

  try {
    const newRaffle = await db.transaction(async (tx) => {
      const [createdRaffle] = await tx
        .insert(raffles)
        .values({
          name,
          description,
          price: price.toString(),
          minimumTickets,
          status: "draft",
        })
        .returning({ id: raffles.id });

      const imageUrls = await Promise.all(
        images.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          const key = `raffles/${createdRaffle.id}/${crypto.randomUUID()}-${file.name}`;
          const url = await uploadToS3(buffer, key, file.type);
          return { url, raffleId: createdRaffle.id };
        })
      );

      if (imageUrls.length > 0) {
        await tx.insert(raffleImages).values(imageUrls);
      }

      return createdRaffle;
    });

    revalidatePath("/rifas");
    return {
      success: true,
      message: "Rifa creada con éxito.",
      data: newRaffle,
    };
  } catch (error) {
    console.error("Error al crear la rifa:", error);
    return {
      success: false,
      message: "Ocurrió un error en el servidor al crear la rifa.",
    };
  }
}

const UpdateRaffleStatusSchema = z.object({
  raffleId: z.string(),
  status: z.enum(raffleStatusEnum.enumValues),
});

export async function updateRaffleStatusAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validatedFields = UpdateRaffleStatusSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { success: false, message: "Datos inválidos." };
  }

  const { raffleId, status } = validatedFields.data;

  try {
    await db
      .update(raffles)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(raffles.id, raffleId));

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
});

export async function updateRaffleAction(formData: FormData): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const newImages = formData.getAll("images") as File[];
  const imagesToDeleteString = formData.get('imagesToDelete') as string | null;

  const validatedFields = UpdateRaffleSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, message: "Error de validación en los campos." };
  }

  const { raffleId, name, description, price, minimumTickets } = validatedFields.data;
  const imageIdsToDelete = imagesToDeleteString?.split(',').filter(id => id.trim() !== '') || [];

  try {
    await db.transaction(async (tx) => {
      await tx.update(raffles).set({
        name,
        description,
        price: price.toString(),
        minimumTickets,
        updatedAt: new Date(),
      }).where(eq(raffles.id, raffleId));

      if (imageIdsToDelete.length > 0) {
        const images = await tx.query.raffleImages.findMany({
          where: inArray(raffleImages.id, imageIdsToDelete)
        });
        
        for (const image of images) {
          const key = image.url.substring(image.url.indexOf('raffles/'));
          await deleteFromS3(key);
        }
        
        await tx.delete(raffleImages).where(inArray(raffleImages.id, imageIdsToDelete));
      }

      if (newImages.length > 0) {
        const imageUrls = await Promise.all(
          newImages.map(async (file) => {
            const buffer = Buffer.from(await file.arrayBuffer());
            const key = `raffles/${raffleId}/${crypto.randomUUID()}-${file.name}`;
            const url = await uploadToS3(buffer, key, file.type);
            return { url, raffleId: raffleId };
          })
        );

        if (imageUrls.length > 0) {
          await tx.insert(raffleImages).values(imageUrls);
        }
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