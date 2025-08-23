'use server'

import { z } from 'zod'

const sendMessageSchema = z.object({
  phoneNumber: z.string().min(8),
  text: z.string().min(1),
})

const sendMessageWithQRSchema = z.object({
  phoneNumber: z.string().min(8),
  text: z.string().min(1),
  image: z.string().min(1),
});

type SendMessageResponse = {
  success: boolean
  error?: string
  data?: any
}

export async function sendWhatsappMessage(
  phoneNumber: string,
  text: string
): Promise<SendMessageResponse> {
  try {
    // Check if messaging is enabled in environment variables
    const messagesEnabled = process.env.MESSAGES_ENABLED === 'true';
    if (!messagesEnabled) {
      console.log('WhatsApp messages are disabled by environment setting');
      return { success: true, data: { skipped: true, reason: 'Messages disabled by environment setting' } };
    }
    
    const validated = sendMessageSchema.parse({ phoneNumber, text })
    const cleanPhone = validated.phoneNumber.replace(/\D/g, '')
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL
    const API_KEY = process.env.EVO_API_KEY
    const INSTANCE_NAME = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'pobox'
    // Get boss phone from environment variable
    const bossPhone = process.env.BOSS_PHONE || '+584248683073'

    if (!API_BASE_URL || !API_KEY) {
      throw new Error('Missing Evolution API configuration')
    }

    const response = await fetch(`${API_BASE_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: validated.text,
        delay: 450,
        linkPreview: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send message')
    }

    const data = await response.json()
    return { success: true, data }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    }
  }
}

export async function sendWhatsappMessageWithQR(
  phoneNumber: string,
  text: string,
  image: string
): Promise<SendMessageResponse> {
  try {
    // Check if messaging is enabled in environment variables
    const messagesEnabled = process.env.MESSAGES_ENABLED === 'true';
    if (!messagesEnabled) {
      console.log('WhatsApp messages are disabled by environment setting');
      return { success: true, data: { skipped: true, reason: 'Messages disabled by environment setting' } };
    }
    
    const validated = sendMessageWithQRSchema.parse({ 
      phoneNumber, 
      text, 
      image
    });
    
    // Remove the data URL prefix if present
    const base64Image = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    const cleanPhone = validated.phoneNumber.replace(/\D/g, '')
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL
    const API_KEY = process.env.EVO_API_KEY
    const INSTANCE_NAME = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'Multiservice'
    // Get boss phone from environment variable
    const bossPhone = process.env.BOSS_PHONE || '+584167435109'

    if (!API_BASE_URL || !API_KEY) {
      throw new Error('Missing Evolution API configuration')
    }

    const response = await fetch(`${API_BASE_URL}/message/sendMedia/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: cleanPhone,
        mediatype: "image",
        mimetype: "image/png",
        media: base64Image, // Send only the base64 string without the prefix
        caption: validated.text,
        fileName: `order-${Date.now()}.png`, // Add a dynamic filename
        delay: 450,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send media message')
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }

  } catch (error) {
    console.error('Error sending WhatsApp message with QR:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message with QR',
    }
  }
}

export async function sendWhatsappMessageWithPDF(
  phoneNumber: string,
  text: string,
  pdfBase64: string,
  fileName: string
): Promise<SendMessageResponse> {
  try {
    // Check if messaging is enabled in environment variables
    const messagesEnabled = process.env.MESSAGES_ENABLED === 'true';
    if (!messagesEnabled) {
      console.log('WhatsApp messages are disabled by environment setting');
      return { success: true, data: { skipped: true, reason: 'Messages disabled by environment setting' } };
    }
    
    // Remove any data URL prefix if present
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    
    // Log the original phone before cleaning
    console.log('Original phone number before cleaning:', phoneNumber);
    
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Log the phone after cleaning to see if formatting is an issue
    console.log('Clean phone number after removing non-digits:', cleanPhone);
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL
    const API_KEY = process.env.EVO_API_KEY
    const INSTANCE_NAME = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || 'Multiservice'
    // Get boss phone from environment variable
    const bossPhone = process.env.BOSS_PHONE || '+584167435109'

    if (!API_BASE_URL || !API_KEY) {
      throw new Error('Missing Evolution API configuration')
    }

    console.log(`Attempting to send PDF to ${cleanPhone}, file name: ${fileName}`);
    
    // Create the request body
    const requestBody = {
      number: cleanPhone,
      mediatype: "document",
      mimetype: "application/pdf",
      media: base64Data,
      caption: text,
      fileName: fileName || `document-${Date.now()}.pdf`,
      delay: 450,
    };
    
    // Log the request body (without the media content for brevity)
    console.log('Request body (without media content):', {
      ...requestBody,
      media: base64Data ? `[Base64 string of length ${base64Data.length}]` : '[No media data]'
    });
    
    const response = await fetch(`${API_BASE_URL}/message/sendMedia/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Evolution API response error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || `Failed to send PDF document (Status: ${response.status})`)
    }

    const data = await response.json()
    console.log('Success response from Evolution API:', data);
    return {
      success: true,
      data,
    }

  } catch (error) {
    console.error('Error sending WhatsApp message with PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message with PDF',
    }
  }
}